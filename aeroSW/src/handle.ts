/**
 * Aero's main handler; this is what you call in your SW when aero should be routed. Ideally, you would determine when it should be routed with. This gets build to the bundle `aeroSW/dist/sw.js`. You must also include the other bundles in your SW with `importScripts` before this one.
 */

// Better type-safe handling
/// For runtime type validation
import { is } from "ts-runtime-checks";
/// Neverthrow
import type { ResultAsync, Result } from "neverthrow";
import { okAsync as nOkAsync, errAsync as nErrAsync, ok as nOk, err as nErr } from "neverthrow";
import { fmtNeverthrowErr } from "$shared/fmtErr";

// Sanity checkers
import troubleshoot, { troubleshootJustConfigs, troubleshootingStrs } from "./fetchHelpers/troubleshoot";
import validateResp from "$aero/aeroSW/src/fetchHandlers/validateResp";

import type { Sec } from "$types/index";

import rewriteReq from "$fetchHandlers/rewriteReq";
// Abstracted rewriter abstractions
/// Req
import getClientURLAeroWrapper from "./fetchHelpers/getClientURLAeroWrapper";
/// Resp
import rewriteResp from "$fetchHandlers/rewriteResp";
import perfEncBodyEmu from "$fetchHandlers/subsystems/perfEncBodyEmu";
import perfCacheSetting from "$fetchHandlers/subsystems/perfCacheSetting";

// Utility
import getPassthroughParam from "$shared/getPassthroughParam";
/// Cosmetic
import { AeroLogger } from "$shared/Loggers";

import type { rewrittenParamsOriginalsType } from "$types/commonPassthrough"

/** aero's SW logger */
self.logger = new AeroLogger(Boolean(DEBUG));

/**
 * Handles the requests that are routed to aero
 * This is only exported so that *aeroCF* can make use of it
 * @param event The passthrough Fetch event
 * @returns The proxified response
 */
export default async function handleSW(event: FetchEvent): Promise<ResultAsync<Response, Error>> {
	// Sanity check: Ensure the handler is being ran in a SW
	if (!is<FetchEvent>(event))
		return nErrAsync(troubleshootingStrs.noFetchEvent);

	// Give troubleshooting instructions if a sanity check occurs at the fault of how the proxy site developer set up the main SW where they didn't initialize things properly
	const troubleshootRes = troubleshoot();
	if (troubleshootRes.isErr())
		// Propogate the error result up the chain (`troubleshoot` is already meant to handle errors itself)
		// @ts-ignore: This is a neverthrow error, so we are fine
		return troubleshootRes;

	// Detect feature flag mismatches
	if (CORS_EMULATION && SERVER_ONLY)
		return nErrAsync(new Error("CORS Emulation is not supported in server-only mode (I am working on query passthrough as an alternative to client IDs for this)"));

	if (SERVER_ONLY && !("getReqDest" in self))
		return nErrAsync("You can't run aero's SW in server-only mode without the `getReqDest` function being defined in the global scope. This method is what is used to determine the request destination, since environments like Cloudflare Workers don't have access to `Request.destination`.");
	if (SERVER_ONLY && !("serverFetch" in self))
		return nErrAsync("You can't run aero's SW in server-only mode without the `serverFetch` function being defined in the global scope. This method is what is used to fetch the proxied request instead of BareMuxe, since environments like Cloudflare Workers to define their native fetch method.");

	// Develop a context
	const req = event.request;
	const reqUrl = new URL(req.url);
	const reqParams = reqUrl.searchParams;
	const reqDest = SERVER_ONLY ? self.getReqDest(req.destination, reqParams) : req.destination;
	/** Used to determine if the request was made to load the homepage; this is needed so that the proxy will know when to rewrite the html files. For example, you wouldn't want it to rewrite a fetch request. */
	const isNavigate =
		req.mode === "navigate" &&
		["document", "iframe"].includes(reqDest);
	/** If the client is an iframe. This is used for determining the request url. */
	const isiFrame = reqDest === "iframe";
	/** If the request is intended for a script, and the script is intended to be a module (recieved through request URL passthrough) */
	let isMod: boolean;
	/** If the request is intended for a script */
	const isScript = reqDest === "script";
	if (isScript) {
		const isModParam = getPassthroughParam(reqParams, "isMod");
		isMod = isModParam && isModParam === "true";
	}

	const accessControlRuleMap = new Map<string, string>();

	// Get the clientUrl through catch-all interception
	const catchAllClientsValid = REQ_INTERCEPTION_CATCH_ALL === "clients" && event.clientId !== "";
	// Detect feature flag mismatches
	if (catchAllClientsValid && SERVER_ONLY)
		return nErrAsync(new Error(`${troubleshootingStrs.devErrTag}Feature Flags Mismatch: The Feature Flag "REQ_INTERCEPTION_CATCH_ALL" can't be set to "clients" when "SERVER_ONLY" is enabled.`));
	const clientUrlRes = await getClientURLAeroWrapper({
		reqUrl,
		reqHeaders: req.headers,
		clientId: event.clientId,
		params: reqParams,
		catchAllClientsValid,
		isNavigate
	})
	if (clientUrlRes.isErr())
		return fmtNeverthrowErr(`${troubleshootingStrs.userErrTag}Failed to get the client URL. You have probably made a typo.`, clientUrlRes.error.message);
	/** This client URL is used when forming the proxy URL and in various uses for emulation */
	const clientUrl = clientUrlRes.value;
	if (clientUrl === "skip") {
		logger.log("Skipping the request");
		return nOkAsync((await fetch(req.url));
	}

	/** This is an object meant for passthrough, ultimately to the response rewriter, that will contain all of the CORS headers that were discarded in `getCORSStatus`, and will be injected into the site for CORS Emulation features powered by *AeroSandbox* */
	const sec: Partial<Sec> = {};
	/** This is mainly intended so that `appendSearchParam()`, whenever it is called, can help the response header rewriter with `No-Vary-Search` header rewriting later */
	const rewrittenParamsOriginals: rewrittenParamsOriginalsType = {};

	const rewrittenReqValsRes = await rewriteReq({
		logger,
		req,
		reqUrl: URL,
		clientId: event.clientId,
		clientUrl,
		aeroPathFilter: aeroConfig.aeroPathFilter,
		reqDestination: SERVER_ONLY ? self.getReqDest(reqDest,
			isNavigate) : isNavigate,
		isiFrame,
		sec,
		clients,
		rewrittenParamsOriginals
	}, accessControlRuleMap);
	if (rewrittenReqValsRes.isErr())
		return fmtNeverthrowErr("Failed to rewrite the request", rewrittenReqValsRes.error.message);
	const rewrittenReqVals = rewrittenReqValsRes.value;
	if ("finalRespEarly" in rewrittenReqVals)
		return nOkAsync((rewrittenReqVals.finalRespEarly);
	const { rewrittenReqOpts, proxyUrl, cacheMan } = rewrittenReqVals;

	// Make the request to the proxy
	const proxyResp = (SERVER_ONLY ? self.serverFetch : await new BareMux.BareClient()).fetch(
		proxyUrl,
		rewrittenReqOpts
	);
	// Sanity checks for if the response is invalid
	const validateRespRes = validateResp(proxyResp);
	if (validateRespRes.isErr())
		// Propogate the error result up the chain (`validateResp` is already meant to handle errors itself)
		return validateRespRes;

	// Rewrite the response
	const rewrittenRespRes = await rewriteResp({
		originalResp: proxyResp,
		rewrittenReqHeaders: rewrittenReqOpts.headers,
		reqDestination: reqDest,
		proxyUrl,
		clientUrl,
		isNavigate,
		isMod,
		sec,
		rewrittenParamsOriginals
	});
	if (rewrittenRespRes.isErr())
		return fmtNeverthrowErr("Failed to rewrite the response", rewrittenRespRes.error.message);
	const { rewrittenBody, rewrittenRespHeaders, rewrittenStatus } = rewrittenRespRes.value;

	// Perform encoded body emulation
	if (ENC_BODY_EMULATION)
		// This will modify the resp headers
		perfEncBodyEmu(originalResp, rewriteRespHeaders);

	/** The rewritten response */
	const rewrittenResp = new Response(proxyResp.status === 204 ? null : rewrittenBody, {
		headers: rewrittenRespHeaders,
		status: rewrittenStatus
	});

	// Perform Cache Emulation
	if (CACHES_EMULATION) {
		const perfCacheSettingRes = perfCacheSetting({
			reqUrlHref: reqUrl.href,
			rewrittenResp,
			// @ts-ignore: This is created under an if statement of `FEATURES_CACHE_EMULATION`, so we are fine
			cacheMan,
			cache
		})
		if (perfCacheSettingRes.isErr())
			return fmtNeverthrowErr("Failed to cache the response", perfCacheSettingRes.error.message);
	}

	// Return the response
	return nOkAsync((rewrittenResp);
}

/**
 * Aero's main handler; this is what you call in your SW when aero should be routed. Ideally, you would determine when it should be routed with `routeAero`. This also internally wraps `handleAssertReturning` to add on detail to the errors from `https://github.com/GoogleFeud/ts-runtime-checks`.
 */
self.aeroHandle = handleSW;
/**
 * Check if the current path should route to aero using the prefix you set in the config
 * @param event 
 * @returns If `aeroHandle` should be called
 */
self.routeAero = (event: Assert<FetchEvent>): Result<boolean, Error> => {
	// Sanity check: Ensure the handler is being ran in a SW
	if (!is<FetchEvent>(event))
		return nErr(troubleshootingStrs.noFetchEventMsg);

	// Give troubleshooting instructions if a sanity check occurs at the fault of how the proxy site developer set up the main SW where they didn't initialize things properly
	const troubleshootJustConfigsRes = troubleshootJustConfigs();
	if (troubleshootJustConfigsRes.isErr())
		// Propogate the error result up the chain (`troubleshootJustConfigs` is already meant to handle errors itself)
		return troubleshootJustConfigsRes;

	return nOk(event.request.url.startsWith(location.origin + aeroConfig.prefix));
}