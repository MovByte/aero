import { ResultAsync, okAsync, errAsync as errrAsync }

import type { BareMux } from "@mercuryworkshop/bare-mux";
import type { Sec } from "$aero/types";

// Utility
import { afterPrefix } from "$sandbox/shared/getProxyUrl";
import appendSearchParam from "../AeroSandbox/src/shared/appendSearchParam"; // TODO: $shared
import getPassthroughParam from "./util/getPassthroughParam";
import getRequestUrl from "./util/getRequestUrl";
import redir from "./util/redir";
// TODO: Fix import - import clear from "./isolation/execClearEmulationOnWindowClients";
import isHTML from "$sandbox/shared/isHTML";
import escapeJS from "./util/escapeJS";
// Cosmetic
import { AeroLogger } from "$sandbox/shared/Loggers";

// Security
// CORS Emulation
import block from "./isolation/corsTesting";
import HSTSCacheEmulation from "./isolation/HSTSCacheEmulation";
// Integrity check
import integral from "./embeds/integral";
// Cache Emulation
import CacheManager from "$aero/src/this/isolation/CacheManager";

// Rewriters
import rewriteReqHeaders from "$rewriters/reqHeaders";
import rewriteRespHeaders from "$rewriters/respHeaders";
import rewriteCacheManifest from "$rewriters/cacheManifest";
import rewriteManifest from "$rewriters/webAppManifest";

// TODO: Use JSRewriter class instead of rewriteScript
import JSRewriter from "$sandbox/sandboxers/JS/JSRewriter";
import type { Config } from "$aero/types/config";

// TODO: Import the aero JS parser config types from aerosandbox into aero's sw types
//const jsRewriter = new JSRewriter(self.config.aeroSandbox.jsParserConfig);

// TODO: import init from "./handlers/init";

type proxyOrigin = string;
declare const self: WorkerGlobalScope &
	typeof globalThis & {
		config: Config;
		aeroConfig: Config;
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		BareMux: BareMux;
		handle;
		logger: AeroLogger;
		nestedSWs: Map<proxyOrigin, NestedSW[]>;
	};

self.logger = new AeroLogger();
self.config = aeroConfig;

/**
 * Handles the requests
 * @param - The event
 * @returns  The proxified response
 */
// TODO: Move all the proxy middleware code to a bare mixin
// TODO: Use Neverthrow
async function handle(event: Assert<FetchEvent>): Promise<ResultAsync<Response, Error>> {
	// Ensure that everything has been initalized properly
	if (!("logger" in self))
		throw new Error("The logger hasn't been initalized!");
	if (!("aeroConfig" in self))
		throw logger.fatalErr("The is no config provided");
	/** The feature flags that are expected to be used in this SW handler */
	const expectedFeatureFlags /*: keyof FeatureFlagsRspack*/ = [
		REQ_INTERCEPTION_CATCH_ALL,
		FEATURE_CORS_EMULATION,
		FEATURE_INTEGRITY_EMULATION,
		FEATURE_ENC_BODY_EMULATION,
		FEATURE_CACHES_EMULATION,
		FEATURE_CLEAR_EMULATION,
		REWRITER_HTML,
		REWRITER_XSLT,
		REWRITER_JS,
		REWRITER_CACHE_MANIFEST,
		SUPPORT_LEGACY,
		SUPPORT_WORKER,
		AERO_BRANDING_IN_PROD,
		GITHUB_REPO,
		SERVER_ONLY,
		DEBUG
	]; // TODO: Add them all
	const missingFeatureFlags /*: keyof FeatureFlagsRspack*/ = [];
	for (const expectedFeatureFlag of expectedFeatureFlags)
		if (typeof expectedFeatureFlag === "undefined")
			missingFeatureFlags.push(expectedFeatureFlag);
	Object.freeze(missingFeatureFlags);
	if (missingFeatureFlags.length > 0)
		throw self.logger.fatalErr(
			`The expected feature flags required in this SW were not found: ${missingFeatureFlags.join(", ")}`
		);
	const req = event.request;

	// Dynamic config
	// TODO: Dynamically switch backends
	//const { backends /*, wsBackends, wrtcBackends*/ } = getConfig();

	const reqUrl = new URL(req.url);

	const params = reqUrl.searchParams;

	// Don't rewrite the requests for aero's own bundles
	if (self.config.aeroPathFilter(reqUrl.pathname)) {
		const reqOpts: RequestInit = {};
		if (!DEBUG) {
			// Cached to lower the paint time
			reqOpts.headers = {
				"cache-control": "private"
			};
		}
		return await fetch(req.url);
	}

	let isMod: boolean;
	const isScript = req.destination === "script";
	if (isScript) {
		const isModParam = getPassthroughParam(params, "isMod");
		isMod = isModParam && isModParam === "true";
	}

	const frameSec = getPassthroughParam(params, "frameSec");

	let clientURL: URL;
	// Get the origin from the user's window
	if (REQ_INTERCEPTION_CATCH_ALL === "clients" && event.clientId !== "") {
		if (SERVER_ONLY) {
			throw self.logger.fatalErr(
				'The Feature Flag "REQ_INTERCEPTION_CATCH_ALL" can\'t be set to "clients" when "SERVER_ONLY" is enabled.'
			);
		}
		// Get the current window
		const client = await clients.get(event.clientId);
		if (client)
			// Get the url after the prefix
			clientURL = new URL(afterPrefix(client.url));
	} else if (REQ_INTERCEPTION_CATCH_ALL === "referrer") {
		const referrerPolicy = req.headers["referrer-policy"];
		if (referrerPolicy)
			appendSearchParam(
				params,
				self.config.searchParamOptions.referrerPolicy,
				referrerPolicy
			);
	} else {
		self.logger.fatalErr(
			"No catch-all interception types found and rewrite-url is currently unsupported."
		);
	}

	/** Used to determine if the request was made to load the homepage; this is needed so that the proxy will know when to rewrite the html files. For example, you wouldn't want it to rewrite a fetch request. */
	const isNavigate =
		req.mode === "navigate" &&
		["document", "iframe"].includes(req.destination);

	if (!isNavigate && !clientURL) {
		// TODO: Make a custom fatalErr for SWs that doesn't modify the DOM but returns the error simply instead of overwriting the site with an error site
		throw self.logger.fatalErr(
			"No clientUrl found on a request to a resource! This means your windows are not accessible to us."
		);
		// biome-ignore lint/style/noUselessElse: <explanation>
	} else if (clientURL) {
		// Ignore content scripts from extensions
		if (clientURL.protocol === "chrome-extension:")
			self.logger.log("Ignoring content script");
		// Ignore view source
		if (clientURL.protocol === "view-source:")
			self.logger.log("Ignoring view source");
		if (!clientURL.protocol.startsWith("http")) {
			// TODO: Support custom protocols
			throw self.logger.fatalErr(
				`Unknown protocol used: ${clientURL.protocol}. Full url ${clientURL.href}`
			);
		}
	}

	/*
	if (self.nestedSWs.size !== 0) {
		// TODO: Implement
		// TODO: Start by checking the proxy origin is the same as the client's proxyOrigin comparing nestedSw.item(n).proxyOrigin to clientUrl.origin
	}
	*/

	//
	/** If the client is an iframe. This is used for determining the request url. */
	const isiFrame = req.destination === "iframe";

	/** The URL to the site that will be proxied in a raw form. This will later be parsed. */
	const rawProxyUrlRes = getRequestUrl(
		reqUrl.origin,
		location.origin,
		clientURL,
		reqUrl.pathname + reqUrl.search,
		isNavigate,
		isiFrame
	);

	if (rawProxyUrlRes.isErr())
		return $aero.logger.fatalErr(
			`Error while getting the raw proxy URL required to get the final formatted proxy URL used for fetching the site under the proxy: ${rawProxyUrlRes.error}`
		);

	// TODO: Make this safe
	/** The URL to the site that will be proxied */
	let proxyUrl: URL;
	try {
		// Parse the request url to get the url to proxy
		proxyUrl = new URL(rawProxyUrlRes.value);
	} catch (err) {
		const event = err instanceof TypeError
			? "Failed to parse"
			: "Unknown error when trying to parse";
		return errrAsync(
			new Error(
				`${event} the raw proxy URL to get the final formatted proxy URL used for fetching the site under the proxy${ERROR_LOG_AFTER_COLON}${err.message}`
			));
	}

	// Ensure the request isn't blocked by CORS
	if (FEATURE_CORS_EMULATION) {
		const reqBlockedRes = await block(proxyUrl.href);
		if (reqBlockedRes.isErr()) {
			const err = new Error(`Failed to deterine if the request should be blocked due to a would've been CORS violation${ERROR_LOG_AFTER_COLON}${reqBlockedRes.error()}`);
			if (DEBUG)
				return errr($aero.logger.fatalErr(err));
			$aero.logger.fatalErr(err);
		}
		// TODO: Log this event if verbose/debug is enabled
		return new Response("Blocked by CORS", { status: 500 });
	}

	// Log request
	self.logger.log(
		req.destination === ""
			? `${req.method} ${proxyUrl.href}`
			: `${req.method} ${proxyUrl.href} (${req.destination})`
	);

	// Rewrite the request headers
	const rewrittenReqHeaders = req.headers;

	let sec: Sec;
	if (FEATURE_CACHES_EMULATION) {
		if (proxyUrl.protocol === "http:") {
			const hstsCacheEmulator = new HSTSCacheEmulation(
				rewrittenReqHeaders.get("strict-transport-security"),
				proxyUrl.origin
			);

			// TODO: Use neverthrow
			const redirectRes = await hstsCacheEmulator.redirect();
			if (redirectRes.isErr()) {
				const redirectResErr = new Error(`Failed to determine if the client should redirect when using the cache emulator${ERROR_LOG_AFTER_COLON}${redirectRes.error.message}`)
				if (DEBUG) {
					return $aero.logger.fatalErr(redirectResErr)
				}
				$aero.logger.fatalErr(redirectResErr)
			} else {
				const redirUrl = proxyUrl;
				redirUrl.protocol = "https:";
				return redir(redirUrl.href);
			}
		}
	}

	if (FEATURE_CORS_EMULATION) {
		if (rewrittenReqHeaders.has("timing-allow-origin"))
			sec.timing = rewrittenReqHeaders.get("timing-allow-origin");
		if (rewrittenReqHeaders.has("permissions-policy"))
			sec.perms = rewrittenReqHeaders.get("permissions-policy");
		if (rewrittenReqHeaders.has("x-frame-options"))
			sec.frame = rewrittenReqHeaders.get("x-frame-options");
		if (rewrittenReqHeaders.has("content-security-policy"))
			sec.csp = rewrittenReqHeaders.get("content-security-policy");
	}

	/*
	if (FEATURE_CLEAR_EMULATION && reqHeaders.get("clear-site-data")) {
		sec.clear = JSON.parse(`[${reqHeaders.get("clear-site-data")}]`);
		if ("clear" in sec)
			await clear(sec.clear, await clients.get(event.clientId), proxyUrl);
	} else sec.clear = false;
	*/

	/** The manager for storing information needed for Cache Emulation */
	let cacheMan: CacheManager;
	if (FEATURE_CACHES_EMULATION) {
		cacheMan = new CacheManager(rewrittenReqHeaders);

		if (cacheMan.mode === "only-if-cached")
			// TODO: log here if in DEBUG/VERBOSE
			// TODO: Emulate network error for your given browser. I would ideally do this through a compile-time macro that fetches the src code of the browsers.
			return new Response("Can't find a cached response", {
				status: 500
			});
	}

	//rewriteReqHeaders(reqHeaders, clientUrl);

	/** The request options, but rewritten to be proxified for aero */
	const rewrittenReqOpts: RequestInit = {
		method: req.method,
		headers: rewrittenReqHeaders
	};

	// A request body should not be created under these conditions
	if (!["GET", "HEAD"].includes(req.method)) rewrittenReqOpts.body = req.body;

	// Make the request to the proxy
	const resp = await new BareMux.BareClient().fetch(
		new URL(proxyUrl).href,
		rewrittenReqOpts
	);

	if (!resp) self.logger.fatalErr("No response found!");
	if (resp instanceof Error) throw Error;

	if (FEATURE_CACHES_EMULATION) {
		const cacheAge = cacheMan.getAge(
			rewrittenReqHeaders.get("cache-control"),
			rewrittenReqHeaders.get("expires")
		);

		const c1achedResp = await cacheMan.get(reqUrl, cacheAge);
		if (cachedResp) return cachedResp;
	}

	// Rewrite the response headers
	const rewrittenRespHeadersRes = rewriteRespHeaders(resp.headers, {
		proxyUrl,
		originFullUrl: new URL(resp.headers.referrer),
		bc: new BareMux.BareClient()
	});
	if (rewrittenRespHeadersRes.isErr())
		$aero.logger.fatalErr(`Failed to rewrite the response headers${ERROR_LOG_AFTER_COLON}${rewrittenRespHeadersRes.error.message}`);
	const rewrittenRespHeaders = rewrittenRespHeadersRes.value;

	// Overwrite the response headers (they are immutable)
	/*
	Object.defineProperty(resp, "headers", {
		value: rewrittenRespHeaders,
		configurable: false
	});
	*/

	const type = resp.headers.get("content-type");

	// For modules
	const isModWorker =
		new URLSearchParams(location.search).get("isMod") === "true";

	const html =
		// Not all sites respond with a type
		typeof type === "undefined" || isHTML(type);

	let rewrittenBody: string | ReadableStream;
	// Rewrite the body
	// TODO: Pack these injected scripts with Webpack
	if (REWRITER_HTML && isNavigate && html) {
		const body = await resp.text();
		// TODO: Eliminate _IMPORT_ recursion somehow
		if (body !== "") {
			const base = /* html */ `
<!DOCTYPE html>
<head>
    <!-- Fix encoding issue -->
    <meta charset="utf-8">

    <!-- Favicon -->
    <!--
    Delete favicon if /favicon.ico isn't found
    This is needed because the browser caches the favicon from the previous site
    -->
    <link href="data:image/x-icon;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQEAYAAABPYyMiAAAABmJLR0T///////8JWPfcAAAACXBIWXMAAABIAAAASABGyWs+AAAAF0lEQVRIx2NgGAWjYBSMglEwCkbBSAcACBAAAeaR9cIAAAAASUVORK5CYII=" rel="icon" type="image/x-icon">
    <!-- If not defined already, manually set the favicon -->
    <link href="/favicon.ico" rel="icon" type="image/x-icon">

    <script src="${self.config.bundles.sandboxInitAero}"></script>
    <script>
		{
			// Aero's global proxy namespace
			// The only things defined in here at this time are what is needed to be passed through the SW context to the client context. The rest is defined in the client when the aero bundle for the client is loaded.
			window.$aero = {
				...window.$aero,
				// Security
				sec:  { ${sec ? `...${JSON.stringify(sec)}` : ""} },
				// This is used to later copy into an iFrame's srcdoc; this is for an edge case
				init: \`_IMPORT_\`,
				prefix: ${self.config.prefix},
				searchParamOptions: ${JSON.stringify(
				self.config.searchParamOptions
			)},
			};
		}
    </script>
    <!-- TODO: Make a logger bundle just for the client, which registers on whatever object is provided by \`$aero.sandbox.config.loggerNamespace\`, for example, with the default config it would register to \`$aero.logger\` -->
	<script src="${self.config.bundles.aeroSandbox}"></script>
	<script src="${self.config.bundles.loggerClient}"></script>
	<script type="module">
		import aeroSandboxConfig from "${self.config.bundles.aeroSandboxConfig}";
		if (!(AeroSandbox in self)) {
			//TODO: Make this method do a crash string
			$aero.logger.fatalErr("Missing the AeroSandbox declaration after importing the AeroSandbox bundle")
		}
		const aeroSandbox new AeroSandbox({
			config: aeroSandboxConfig
		});
		aeroSandbox.registerStorageIsolators("$aero") // takes in the storage key prefix you want
		aeroSandbox.fakeOrigin();
		${DEBUG || AERO_BRANDING_IN_PROD ? `$aero.logger.image(${aeroConfig.bundles.logo})` : ""}
		$aero.logger.log("Welcome to aero! Our GitHub repo is at ${GITHUB_REPO}.")
		$aero.logger.log("\\nAeroSandbox has been loaded and initialized: aero is ready to go!");
	</script>
    <script src="${self.config.bundles.sandboxEndAero}"></script>
</head>
`;

			// Recursion
			rewrittenBody = base.replace(/_IMPORT_/, escapeJS(base)) + body;
		}
	} else if (
		REWRITER_XSLT &&
		isNavigate &&
		(type.startsWith("text/xml") || type.startsWith("application/xml"))
	) {
		const body = await resp.text();
		rewrittenBody = body;

		// TODO: Update this to support modern aero
		/*
		xml rewrittenBody = `
<config>
{
	prefix: ${prefix}
}
</config>
<?xml-stylesheet type="text/xsl" href="/aero/browser/xml/intercept.xsl"?>
${body}
		`;
		*/
		// @ts-ignore
	} /*else if (REWRITER_JS && isScript) {
		const script = await resp.text();

		if (FEATURE_INTEGRITY_EMULATION) {
			body = jsRewriter.wrapScript(script, {
				isModule: isMod,
				insertCode: /* js *\/ `
  {
	const bak = decodeURIComponent(escape(atob(\`${escapeJS(script)}\`)));
	${integral(isMod)}
  }
  `
			});
			// @ts-ignore
		} else
			body = jsRewriter.wrapScript(script, {
				isModule: isMod
			});

	} */ else if (REWRITER_CACHE_MANIFEST && req.destination === "manifest") {
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

	if (FEATURE_ENC_BODY_EMULATION) {
		// FIXME: Fix whatever this is. I forgot where I was going with this.
		resp.headers["x-aero-size-transfer"] = null;
		resp.headers["x-aero-size-encbody"] = null;

		// TODO: x-aero-size-transfer
		if (typeof rewrittenBody === "string") {
			resp.headers["x-aero-size-body"] = new TextEncoder().encode(
				rewrittenBody
			).length;
			// TODO: Emulate x-aero-size-encbody
		} else if (rewrittenBody instanceof ArrayBuffer) {
			resp.headers["x-aero-size-body"] = rewrittenBody.byteLength;
			// TODO: Emulate x-aero-size-encbody
		}
	}

	if (FEATURE_CACHES_EMULATION) {
		// Cache the response
		const cacheManSetRes = await cacheMan.set(reqUrl.href, resp, resp.headers.get("vary"));
		if (cacheManSetRes.isErr()) {
			const baseErrMsg = "Error while trying to set the new emulated cache";
			if (DEBUG)
				return $aero.logger.fatalErr(new Error(`${baseErrMsg} (can't proceed): ${cacheManSetRes.error.message}`));
			// aero's SW will proceed (not crash), but this feature won't work unfortunately
			// TODO: Do this pattern everywhere of not crashing, but proceeding with a warning when not in DEBUG Mode
			$aero.logger.fatalErr(new Error(`${baseErrMsg} (can't proceed with Cache Emulation): ${cacheManSetRes.error.message}`));
		} else {
			// Return the response
			return okAsync(new Response(resp.status === 204 ? null : rewrittenBody, {
				headers: resp.headers,
				status: resp.status
			}));
		}
	}

	self.aeroHandle = handle;
	self.routeAero = (event: Assert<FetchEvent>): boolean => {
		return event.request.url.startsWith(location.origin + aeroConfig.prefix);
	};
