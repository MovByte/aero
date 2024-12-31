// For better type safety
/// Neverthrow
import type { ResultAsync } from "neverthrow";
import { okAsync } from "neverthrow";
import { fmtNeverthrowErr } from "$shared/fmtErr";

import injFmtWrapper from "$aero/src/this/util/internal/injFmtWrapper";
// Preprocessor
import mainFmtHTML from "../../preprocessors/mainInjBundle/mainFmtHTML.val";
import mainInjFmtXSLT from "$preprocessors/mainInjFmtXSLT";

// Utility
import isHTML from "$sandbox/shared/isHTML";
import escapeJS from "$util/escapeJS";

// Resp Rewriters
import rewriteRespHeaders from "$rewriters/respHeaders";
import rewriteCacheManifest from "$rewriters/cacheManifest";
import rewriteManifest from "$rewriters/webAppManifest";
import JSRewriter from "$sandbox/sandboxers/JS/JSRewriter";

import type { Sec } from "$aero/aeroSW/types";
import type { rewrittenParamsOriginalsType } from "$types/commonPassthrough"

const jsRewriter = new JSRewriter(aeroConfig.sandbox.jsParserConfig);

/**
 * Rewrites the response with the content rewriters and the response headers rewriter
 * @param param0 The passthrough object needed for the cache setting
 * @returns 
 */
export default async function rewriteResp(pass: Readonly<{
	originalResp: Response;
	rewrittenReqHeaders: Headers,
	/** If you are making a server-only implementation, you could infer this from the mime type and file type */
	reqDestination: string;
	proxyUrl: URL;
	clientUrl: string;
	isScript: boolean;
	isNavigate: boolean;
	isMod: boolean;
	sec: Readonly<Sec>;
	/** This is for `No-Vary-Search` rewriting */
	rewrittenParamsOriginals: rewrittenParamsOriginalsType;
}>, accessControlRuleMap: Map<string, string>): Promise<ResultAsync<{
	rewrittenBody: string | ReadableStream;
	rewrittenRespHeaders: Headers,
	rewrittenStatus: number
}, Error>> {
	const {
		originalResp,
		rewrittenReqHeaders,
		reqDestination,
		proxyUrl,
		clientUrl,
		isScript,
		isNavigate,
		isMod,
		sec,
		rewrittenParamsOriginals
	} = pass;

	// Rewrite the response headers
	const rewrittenRespHeaders = { ...originalResp.headers };
	const rewrittenRespHeadersRes = rewriteRespHeaders(rewrittenRespHeaders, {
		proxyUrl,
		clientUrl,
		bc: new BareMux.BareClient(),
		rewrittenParamsOriginals
	});
	if (rewrittenRespHeadersRes.isErr())
		return fmtNeverthrowErr("Failed to rewrite the response", rewrittenRespHeadersRes.error.message);
	const { speculationRules } = rewrittenRespHeadersRes.value;

	const type = originalResp.headers.get("content-type");

	// For modules
	const isModWorker =
		new URLSearchParams(location.search).get("isMod") === "true";

	/** If the request is meant to be to an HTML webpage */
	const html =
		// Not all sites respond with a type
		typeof type === "undefined" || isHTML(type);

	let rewrittenBody: string | ReadableStream;
	// Rewrite the body
	if (REWRITER_HTML && isNavigate && html) {
		const body = await originalResp.text();
		const rewrittenBodyBeforeImport = injFmtWrapper(mainFmtHTML, {
			"BUNDLES_SANDBOX_INIT": aeroConfig.bundles.sandboxInitAero,
			"BUNDLES_SANDBOX_END": aeroConfig.bundles.sandboxEndAero,
			"BUNDLES_LOGGER_CLIENT": aeroConfig.bundles.loggerClient,
			"FORCE_INLINED_SPECULATION_RULES": speculationRules.isSome() ? `
<script type="speculationRules">
	${speculationRules.value}
</script>` : ""
		}, {
			"CLIENT_ID": aeroConfig.clientId,
			// $aero (global proxy namespace) passthrough
			"SEC": sec ? `...${JSON.stringify(sec)}` : "",
			"PREFIX": aeroConfig.prefix,
			"SEARCH_PARAM_OPTIONS": JSON.stringify(aeroConfig.searchParamOptions),
			// Bundles
			"BUNDLES_SANDBOX_CONFIG": aeroConfig.bundles.aeroSandboxConfig,
			// Misc config options (branding, etc.)
			"IMAGE_LOG": DEBUG || AERO_BRANDING_IN_PROD ? `$aero.logger.image(${aeroConfig.bundles.logo})` : "",
			"GITHUB_REPO": aeroConfig.githubRepo,
		})
		// Recursion (for iframes)
		rewrittenBody = injFmtWrapper(rewrittenBodyBeforeImport, {}, {
			"IMPORT": rewrittenBodyBeforeImport
		});
		// Finally, apply the original body untouched
		rewrittenBody += `\n${body}`;
	} else if (
		REWRITER_XSLT &&
		isNavigate &&
		(type?.startsWith("text/xml") || type?.startsWith("application/xml"))
	) {
		const body = await originalResp.text();
		rewrittenBody = body;

		// TODO: Update this to support modern aero

		rewrittenBody = `${mainInjFmtXSLT}\n${body}`;
	} else if (REWRITER_JS && isScript) {
		const script = await originalResp.text();

		let rewriteOptionsShared = {}
		if (sourcemapPath.isSome())
			rewriteOptionsShared = {
				sourcemapPath: sourcemapPath.value
			};
		if (INTEGRITY_EMULATION) {
			rewrittenBody = jsRewriter.wrapScript(script, {
				isModule: isMod,
				insertCode: /* js\ */ `
{
	const bak = decodeURIComponent(escape(atob(\`${escapeJS(script)}\`)));
	${integrityMainCheck(isMod)}
}
`,
				...rewriteOptionsShared
			});
			// @ts-ignore
		} else
			rewrittenBody = jsRewriter.wrapScript(script, {
				isModule: isMod,
				...rewriteOptionsShared
			});
	} else if (REWRITER_CACHE_MANIFEST && reqDestination === "manifest") {
		const body = await resp.text();

		// Safari exclusive
		if (SUPPORT_LEGACY && type?.includes("text/cache-manifest")) {
			const isFirefox =
				rewrittenReqHeaders.get("user-agent")?.includes("Firefox");

			rewrittenBody = rewriteCacheManifest(body, isFirefox);
		} else rewrittenBody = rewriteManifest(body, proxyUrl);
	} // TODO: Bring back worker support in aero
	else if (SUPPORT_WORKER && reqDestination === "worker")
		rewrittenBody = isModWorker
			? /* js */ `
	import { proxyLocation } from "${aeroConfig.aeroPrefix}worker/worker";
	import { FeatureFlags } from '../featureFlags';
	self.location = proxyLocation;
	`
			: `
	importScripts("${aeroConfig.aeroPrefix}worker/worker.js");
		
	${body}
		`;
	else if (SUPPORT_WORKER && reqDestination === "sharedworker")
		body = isModWorker
			? /* js */ `
	import { proxyLocation } from "${aeroConfig.aeroPrefix}worker/worker";
	self.location = proxyLocation;
	`
			: /* js */ `
	importScripts("${aeroConfig.aeroPrefix}worker/worker.js");
	importScripts("${aeroConfig.aeroPrefix}worker/sharedworker.js");
	${body}
	`;
	// No rewrites are needed; proceed as normal
	else rewrittenBody = resp.body;

	return okAsync({
		rewrittenBody,
		rewrittenRespHeaders,
		rewrittenStatus
	})
}