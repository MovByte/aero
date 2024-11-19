// Neverthrow
import { ResultAsync, okAsync, errAsync as errrAsync } from "neverthrow";
import { fmtNeverthrowErr } from "$sharedUtil/fmtErr";

import type { Sec } from "$aero/types";
import type CacheManager from "./isolation/CacheManager";

// Abstracted req/resp rewriter abstractions
import getProxyURL from "$util/getProxyURL";
import getClientURLAeroWrapper from "$util/getClientURLAeroWrapper";
import getCORSStatus from "$util/getCORSStatus";
import formRequestOpts from "$util/formRequestOpts";
import perfEncBodyEmu from "$util/perfEncBodyEmu";
import perfCacheSetting from "$util/perfCacheSetting";
import rewriteResp from "$util/rewriteResp";

// Utility
import { getPassthroughParam } from "$sharedUtil/getPassthroughParam";
// Cosmetic
import { AeroLogger } from "$sandbox/shared/Loggers";

/** aero's SW logger */
self.logger = new AeroLogger();

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

	// Develop a context
	/** The incoming request */
	const req = event.request;
	/** The request URL */
	const reqUrl = new URL(req.url);

	// Don't rewrite the requests for aero's own bundles
	if (aeroConfig.aeroPathFilter(reqUrl.pathname)) {
		const reqOpts: RequestInit = {};
		if (!DEBUG) {
			// Cached to lower the paint time
			reqOpts.headers = {
				"cache-control": "private"
			};
		}
		logger.log("aero bundle found! Not rewriting (will proceed normally)");
		return okAsync(await fetch(req.url));
	}

	// Develop a context for the utility methods called here
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

	// Get the clientUrl through catch-all interception
	const catchAllClientsValid = REQ_INTERCEPTION_CATCH_ALL === "clients" && event.clientId !== "";
	// Detect feature flag mismatches
	if (catchAllClientsValid && SERVER_ONLY) {
		return errrAsync(new Error('Feature Flags Mismatch: The Feature Flag "REQ_INTERCEPTION_CATCH_ALL" can\'t be set to "clients" when "SERVER_ONLY" is enabled.'));
	}
	const clientUrlRes = await getClientURLAeroWrapper({
		reqUrl,
		reqHeaders: req.headers,
		clientId: event.clientId,
		params: reqParams,
		catchAllClientsValid,
		isNavigate
	})
	if (clientUrlRes.isErr()) {
		return fmtNeverthrowErr("Failed to get the client URL", clientUrlRes.error.message);
	}
	/** This client URL is used when forming the proxy URL and in various uses for emulation */
	const clientUrl = clientUrlRes.value;
	if (clientUrl === "skip") {
		logger.log("Skipping the request");
		return okAsync(await fetch(req.url));
	}

	// Get the proxy URL
	const getProxyURLRes = await getProxyURL({
		reqUrl,
		clientUrl,
		isNavigate,
		isiFrame
	});
	if (getProxyURLRes.isErr())
		return fmtNeverthrowErr("Failed to get the proxy URL", getProxyURLRes.error.message);
	/** The proxy URL used for fetching the site under the proxy */
	const proxyUrl = getProxyURLRes.value;
	// Log the request
	logger.log(
		req.destination === ""
			? `${req.method} ${proxyUrl.href}`
			: `${req.method} ${proxyUrl.href} (${req.destination})`
	);

	/** This is an object meant for passthrough that will contain all of the CORS headers that were discarded in `getCORSStatus`, and will be injected into the site for CORS Emulation features powered by *AeroSandbox* */
	const sec: Partial<Sec> = {};

	// This will apply all of the necessary rewriting to the headers for cors emulation, so it will modify the request headers
	// Performs CORS Emulation and it might return the cached response if one exists in Cache Emulation
	const corsStatusRes = await getCORSStatus({
		reqUrl,
		reqHeaders: req.headers,
		proxyUrl
	},
		// @ts-ignore: The types are compatible
		sec);
	if (corsStatusRes.isErr())
		return fmtNeverthrowErr("Failed to perform CORS emulation/testing", corsStatusRes.error.message);
	const corsStatus = corsStatusRes.value;
	if ("cachedResponse" in corsStatus) {
		logger.log("Returning cached response found through Cache Emulation");
		return okAsync(corsStatus.cachedResponse);
	}
	/** The manager used for getting and setting emulated caches for Cache Emulation */
	let cacheMan: CacheManager;
	if (FEATURES_CACHE_EMULATION && "cacheMan" in corsStatus)
		cacheMan = corsStatus.cacheMan;

	// Get the request options
	const rewrittenReqOptsRes = await formRequestOpts({
		req,
		clientUrl
	});
	if (rewrittenReqOptsRes.isErr())
		return fmtNeverthrowErr("Failed to create the the request options", rewrittenReqOptsRes.error.message);
	/** The request options that will be used to fetch the site under the proxy*/
	const rewrittenReqOpts = rewrittenReqOptsRes.value;

	// Make the request to the proxy
	/** The raw response after being fetched from a BareMux transport */
	const resp = await new BareMux.BareClient().fetch(
		new URL(proxyUrl).href,
		rewrittenReqOpts
	);
	// Sanity checks for if the response is invalid
	if (!resp) return errrAsync(new Error("No response found! The response is invalid"));
	if (resp instanceof Error) {
		if (resp instanceof NetworkError)
			return fmtNeverthrowErr("Failed to fetch the response from the proxy server backend", Error);
		return fmtNeverthrowErr("Failed to fetch the response from the BareMux transport", resp.message);
	}

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
			cacheMan
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
