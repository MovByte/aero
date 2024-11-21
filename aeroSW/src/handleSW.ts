// Better type-safe handling
import type { Assert } from "ts-runtime-checks";
import typia from "typia";
/// Neverthrow
import type { ResultAsync } from "neverthrow";
import { okAsync, errAsync as errrAsync } from "neverthrow";
import { fmtNeverthrowErr } from "$shared/fmtErr";

import type { Sec } from "$aero/types";
// For runtime type validation
import type { Config } from "$aero/config";

// Abstracted rewriter abstractions
/// Req
import getClientURLAeroWrapper from "$fetchHandlers/util/getClientURLAeroWrapper";;
/// Resp
import rewriteResp from "$fetchHandlers/util/rewriteResp";
import perfEncBodyEmu from "$fetchHandlers/util/perfEncBodyEmu";
import perfCacheSetting from "$fetchHandlers/util/perfCacheSetting";

// Utility
import { getPassthroughParam } from "$shared/getPassthroughParam";
/// Cosmetic
import { AeroLogger } from "$shared/Loggers";

/** aero's SW logger */
self.logger = new AeroLogger();
const loggerValidation = typia.validate<AeroLogger>(logger);
const configValidation = typia.validate<Config>(aeroConfig);

// Shared strings
/** A message for when the user fails to import a bundle */
const tryImportingItMsg = ". Try importing the bundle.";

/**
 * Handles the requests that are routed to aero
 * @param event The passthrough Fetch event
 * @returns The proxified response
 */
async function handle(event: Assert<FetchEvent>): Promise<ResultAsync<Response, Error>> {
	// Sanity checks to ensure that everything has been initalized properly
	if (!("logger" in self))
		return errrAsync(new Error(`The logger hasn't been initalized!${tryImportingItMsg}`));
	if (!("BareMux" in self))
		throw errrAsync(new Error(`There is no bare client (likely BareMux) provided!${tryImportingItMsg}`));
	if (!("aeroConfig" in self))
		return errrAsync(new Error("There is no config provided. You need to create one."));
	/// Runtime type validations
	if (!loggerValidation.success)
		return fmtNeverthrowErr("The logger bundle provided is invalid (perhaps you imported the wrong one?)", ...loggerValidation.errors);
	if (!configValidation.success)
		return fmtNeverthrowErr("The config provided is invalid", ...configValidation.errors);

	// Develop a context
	/** The incoming request */
	const req = event.request;
	/** The request URL */
	const reqUrl = new URL(req.url);
	/** The search params for the request */
	const reqParams = reqUrl.searchParams;
	/** Used to determine if the request was made to load the homepage; this is needed so that the proxy will know when to rewrite the html files. For example, you wouldn't want it to rewrite a fetch request. */
	const isNavigate =
		req.mode === "navigate" &&
		["document", "iframe"].includes(req.destination);
	/** If the client is an iframe. This is used for determining the request url. */
	const isiFrame = req.destination === "iframe";
	/** If the request is intended for a script, and the script is intended to be a module (recieved through request URL passthrough) */
	let isMod: boolean;
	/** If the request is intended for a script */
	const isScript = req.destination === "script";
	if (isScript) {
		const isModParam = getPassthroughParam(reqParams, "isMod");
		isMod = isModParam && isModParam === "true";
	}

	// TODO: Abstract request logic (call anything that calls the request utility methods in one method, including doing the final fetch with bare-mux), so that I can use it inside of AeroSandbox, infact include all of `$fetchHandlers` that is related to requests (not responses) in AeroSandbox and that method, so that I could use it in `xhr.ts`. Also make the requestHandler method an entry point in AeroSandbox, so that in minimal builds aero's SW can share it with AeroSandbox. I will also make a feature flag in AeroSandbox which will be called `SYNC_XHR_REQ` that will enable SYNC XHR support and such import all of the handlers (it's a lot of heavy code for an obscure and long deprecated API). Some things like setting caches will need to use message proxies. Client URL in sync XHR would just be the real location (easy), since we are already on the window client. `isNavigate`/`isiFrame` would always be be false, `destination` would always be XHR, `isScript` would always be false, etc... 

	// Get the clientUrl through catch-all interception
	const catchAllClientsValid = REQ_INTERCEPTION_CATCH_ALL === "clients" && event.clientId !== "";
	// Detect feature flag mismatches
	if (catchAllClientsValid && SERVER_ONLY)
		return errrAsync(new Error('Feature Flags Mismatch: The Feature Flag "REQ_INTERCEPTION_CATCH_ALL" can\'t be set to "clients" when "SERVER_ONLY" is enabled.'));
	const clientUrlRes = await getClientURLAeroWrapper({
		reqUrl,
		reqHeaders: req.headers,
		clientId: event.clientId,
		params: reqParams,
		catchAllClientsValid,
		isNavigate
	})
	if (clientUrlRes.isErr())
		return fmtNeverthrowErr("Failed to get the client URL", clientUrlRes.error.message);
	/** This client URL is used when forming the proxy URL and in various uses for emulation */
	const clientUrl = clientUrlRes.value;
	if (clientUrl === "skip") {
		logger.log("Skipping the request");
		return okAsync(await fetch(req.url));
	}

	/** This is an object meant for passthrough, ultimately to the response rewriter, that will contain all of the CORS headers that were discarded in `getCORSStatus`, and will be injected into the site for CORS Emulation features powered by *AeroSandbox* */
	const sec: Partial<Sec> = {};

	const rewrittenReqValsRes = await rewriteReq({
		logger,
		req,
		reqUrl: URL,
		clientUrl,
		aeroPathFilter: aeroConfig.aeroPathFilter,
		reqDestination: req.destination,
		isNavigate: isNavigate
		isiFrame,
		sec,
		clients
	});
	if (rewrittenReqValsRes.isErr())
		return fmtNeverthrowErr("Failed to rewrite the request", rewrittenReqValsRes.error.message);
	const rewrittenReqVals = rewrittenReqValsRes.value;
	if ("finalRespEarly" in rewrittenReqVals)
		return okAsync(rewrittenReqVals.finalRespEarly);
	const { rewrittenReqOpts, proxyUrl, cacheMan } = rewrittenReqVals;

	// Make the request to the proxy
	/** The raw response after being fetched from a BareMux transport */
	const resp = await new BareMux.BareClient().fetch(
		proxyUrl,
		rewrittenReqOpts
	);
	// Sanity checks for if the response is invalid
	const validateRespRes = validateResp(resp);
	if (validateRespRes.isErr())
		// Propogate the error (`validateResp` is already meant to handle errors itself)
		return validateRespRes;

	// Rewrite the response
	const rewrittenRespRes = await rewriteResp({
		originalResp: resp,
		rewrittenReqHeaders: rewrittenReqOpts.headers,
		reqDestination: req.destination,
		proxyUrl,
		clientUrl,
		isNavigate,
		isMod,
		sec
	});
	if (rewrittenRespRes.isErr())
		return fmtNeverthrowErr("Failed to rewrite the response", rewrittenRespRes.error.message);
	const { rewrittenBody, rewrittenRespHeaders, rewrittenStatus } = rewrittenRespRes.value;

	// Perform encoded body emulation
	if (FEATURE_ENC_BODY_EMULATION)
		// This will modify the resp headers
		perfEncBodyEmu(originalResp, rewriteRespHeaders);

	/** The rewritten response */
	const rewrittenResp = new Response(resp.status === 204 ? null : rewrittenBody, {
		headers: rewrittenRespHeaders,
		status: rewrittenStatus
	});

	// Perform Cache Emulation
	if (FEATURE_CACHES_EMULATION) {
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
	return okAsync(rewrittenResp);
}

/**
 * Aero's main handler; this is what you call in your SW when aero should be routed. Ideally, you would determine when it should be routed with `routeAero`
 */
self.aeroHandle = handle;
/**
 * Check if the current path should route to aero using the prefix you set in the config
 * @param event 
 * @returns If `aeroHandle` should be called
 */
self.routeAero = (event: Assert<FetchEvent>): boolean => event.request.url.startsWith(location.origin + aeroConfig.prefix);
