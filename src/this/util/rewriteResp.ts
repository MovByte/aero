// Neverthrow
import type { ResultAsync } from "neverthrow";
import { okAsync } from "neverthrow";
import { fmtNeverthrowErr } from "$sharedUtil/fmtErr";

import injFmtWrapper from "$aero/src/this/util/internal/injFmtWrapper";
// Preprocessor
import mainFmt from "../../preprocessors/mainInjBundle/mainFmtHTML.val";
import mainInjFmtXSLT from "$preprocessors/mainInjFmtXSLT";

// Utility
import isHTML from "$sandbox/shared/isHTML";
import escapeJS from "$util/escapeJS";

// Resp Rewriters
import rewriteRespHeaders from "$rewriters/respHeaders";
import rewriteCacheManifest from "$rewriters/cacheManifest";
import rewriteManifest from "$rewriters/webAppManifest";
import type JSRewriter from "$sandbox/sandboxers/JS/JSRewriter";

// Passthrough types
import type { BareMux } from "@mercuryworkshop/bare-mux";

export default async function rewriteResp({
	originalResp,
	proxyUrl,
	clientUrl,
	BareMux,
	jsRewriter,
	isNavigate,
	sec
}: {
	originalResp: Response;
	proxyUrl: URL;
	clientUrl: string;
	BareMux: BareMux;
	jsRewriter: JSRewriter;
	isNavigate: boolean;
	sec: Sec;
}): Promise<ResultAsync<{
	rewrittenBody: string | ReadableStream;
	rewrittenHeaders: Headers,
	rewrittenStatus: number
}, Error>> {
	// Rewrite the response headers
	const rewrittenRespHeadersRes = rewriteRespHeaders(originalResp.headers, {
		proxyUrl,
		clientUrl,
		bc: new BareMux.BareClient()
	});
	if (rewrittenRespHeadersRes.isErr())
		return fmtNeverthrowErr("Failed to rewrite the response", rewrittenRespHeadersRes.error.message);
	const rewrittenRespHeaders = rewrittenRespHeadersRes.value;

	const type = resp.headers.get("content-type");

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
		const rewrittenBodyBeforeImport = injFmtWrapper(body, {
			"BUNDLES_SANDBOX_INIT": aeroConfig.bundles.sandboxInitAero,
			"BUNDLES_SANDBOX_END": aeroConfig.bundles.sandboxEndAero,
			"BUNDLES_LOGGER_CLIENT": aeroConfig.bundles.loggerClient,
		}, {
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
	} else if (
		REWRITER_XSLT &&
		isNavigate &&
		(type.startsWith("text/xml") || type.startsWith("application/xml"))
	) {
		const body = await resp.text();
		rewrittenBody = body;

		// TODO: Update this to support modern aero

		rewrittenBody = `${mainInjFmtXSLT}\n${body}`;
	} else if (REWRITER_JS && isScript) {
		const script = await resp.text();

		if (FEATURE_INTEGRITY_EMULATION) {
			body = jsRewriter.wrapScript(script, {
				isModule: isMod,
				insertCode: /* js *\/ `
  {
	const bak = decodeURIComponent(escape(atob(\`${escapeJS(script)}\`)));
	${integrityMainCheck(isMod)}
  }
  `
			});
			// @ts-ignore
		} else
			body = jsRewriter.wrapScript(script, {
				isModule: isMod
			});

	} */ else if(REWRITER_CACHE_MANIFEST && req.destination === "manifest") {
				const body = await resp.text();

				// Safari exclusive
				if (SUPPORT_LEGACY && type.includes("text/cache-manifest")) {
					const isFirefox =
						rewrittenReqHeaders["user-agent"].includes("Firefox");

					rewrittenBody = rewriteCacheManifest(body, isFirefox);
				} else rewrittenBody = rewriteManifest(body, proxyUrl);
			} // TODO: Bring back worker support in aero
	/*else if (SUPPORT_WORKER && req.destination === "worker") {
		rewrittenBody = isModWorker
			? /* js *\/ `
	import { proxyLocation } from "${prefix}worker/worker";
	import { FeatureFlags } from '../featureFlags';
	self.location = proxyLocation;
	`
			: `
	importScripts("${prefix}worker/worker.js");
		
	${body}
		`;
	else if (SUPPORT_WORKER && req.destination === "sharedworker")
		body = isModWorker
			? /* js *\/ `
	import { proxyLocation } from "${prefix}worker/worker";
	self.location = proxyLocation;
	`
			: /* js *\/ `
	importScripts("${prefix}worker/worker.js");
	importScripts("${prefix}worker/sharedworker.js");
		
	${body}
		`;
	*/
	// No rewrites are needed; proceed as normal
	else rewrittenBody = resp.body;

			return okAsync({
				rewrittenBody,
				rewrittenHeaders,
				rewrittenStatus
			})
		}