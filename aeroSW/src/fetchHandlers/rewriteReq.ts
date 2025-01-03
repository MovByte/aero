/**
 * @module
 * You must have the proper feature flags from aeroSW and aeroConfig declared in the global scope 
 */

// Neverthrow
import type { ResultAsync } from "neverthrow";
import { okAsync, errAsync as nErrAsync } from "neverthrow";

// Passthrough types
import type { Config } from "$aeroSWTypes/config";
import type { Sec } from "$aeroSWTypes/cors";
import type { CacheManager } from "$aero/aeroSW/src/fetchHandlers/isolation/CacheManager";
import type { eitherLogger } from "$sandboxTypes/loggers";

// Abstracted req abstractions
import getProxyURL from "$fetchHandlers/util/getProxyURL";
import getCORSStatus from "$fetchHandlers/util/getCORSStatus";
import formRequestOpts from "$fetchHandlers/util/formRequestOpts"

import type { rewrittenParamsOriginalsType } from "$types/commonPassthrough"

const securityPolicyMaps: {
	readonly accessControl: Map<string, string>;
} = {
	accessControl: new Map<string, string>(),
}

export default async function rewriteReq({ logger, req, reqUrl, clientId, clientUrl, aeroPathFilter, reqDestination, isNavigate, isiFrame, sec, cache, rewrittenParamsOriginals }: Readonly<{
	logger: eitherLogger
	req: Request;
	reqUrl: URL;
	clientId: string;
	clientUrl: string;
	bundlesPath: string;
	reqDestination: string;
	isNavigate: boolean;
	isiFrame: boolean;
	sec: Sec;
	/** This is so that you can include a polyfill for when this is being ran in sync XHR (not in a SW context) */
	cache: Cache;
	/** This is mainly intended so that `appendSearchParam()`, whenever it is called, can help the response header rewriter with `No-Vary-Search` header rewriting later */
	rewrittenParamsOriginals: rewrittenParamsOriginalsType;
}>): Promise<ResultAsync<{
	/** You should return the Response in the fetch handler if that is what is returned */
	finalRespEarly?: Response;
} | {
	cacheMan: CacheManager;
	rewrittenReqOpts: RequestInit;
	proxyUrl: string;
}, Error>> {
	// Don't rewrite the requests for aero's own bundles
	if (aeroPathFilter(reqUrl.pathname)) {
		const reqOpts: RequestInit = {};
		if (!DEBUG) {
			// Cached to lower the paint time
			reqOpts.headers = {
				"cache-control": "private"
			};
		}
		logger.debug("aero bundle found! Not rewriting (will proceed normally)");
		return okAsync({
			finalRespEarly: await fetch(reqUrl.href)
		});
	}

	// Get the clientUrl through catch-all interception
	const catchAllClientsValid = REQ_INTERCEPTION_CATCH_ALL === "clients" && event.clientId !== "";
	// Detect feature flag mismatches
	if (catchAllClientsValid && SERVER_ONLY)
		return nErrAsync(new Error('Feature Flags Mismatch: The Feature Flag "REQ_INTERCEPTION_CATCH_ALL" can\'t be set to "clients" when "SERVER_ONLY" is enabled!'));

	if (clientUrlRes.isErr())
		return fmtNeverthrowErr("Failed to get the client URL", clientUrlRes.error);
	/** This client URL is used when forming the proxy URL and in various uses for emulation */
	const clientUrl = clientUrlRes.value;
	if (clientUrl === "skip") {
		logger.debug("Skipping the request");
		return okAsync({
			finalRespEarly: await fetch(req.url)
		});
	}
	// Get the proxy URL
	const getProxyURLRes = await getProxyURL({
		reqUrl,
		clientUrl,
		isNavigate,
		isiFrame
	});
	if (getProxyURLRes.isErr())
		return fmtNeverthrowErr("Failed to get the proxy URL", getProxyURLRes.error);
	/** The proxy URL used for fetching the site under the proxy */
	const proxyUrl = getProxyURLRes.value;
	// Log the request
	logger.debug(
		req.destination === ""
			? `${req.method} ${proxyUrl.href}`
			: `${req.method} ${proxyUrl.href} (${req.destination})`
	);

	// Emulate security policies
	if (securityPolicyMaps.accessControl.has(clientId)) {
		const policies = securityPolicyMaps.accessControl.get(clientId)?.split(" ");
		if (policies) {
			let pass = false;
			for (const policy of policies) {
				if (policy === "null") {
					// TODO: Emulate the value `null` properly (this might require additional AeroSandbox code) https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin#null
				} else if (new URL(proxyUrl).origin === location.origin)
					pass = true;
				else if (policy === "*")
					pass = true;
			}
			if (!pass)
				throw new Error("The request was blocked by Access-Control-Allow-Origin!");
		}
	}

	// This will apply all of the necessary rewriting to the headers for cors emulation, so it will modify the request headers
	// Performs CORS Emulation and it might return the cached response if one exists in Cache Emulation
	const corsStatusRes = await getCORSStatus({
		reqUrl,
		reqHeaders: req.headers,
		proxyUrl,
		caches
	},
		// @ts-ignore: The types are compatible
		sec);
	if (corsStatusRes.isErr())
		return fmtNeverthrowErr("Failed to perform CORS emulation/testing", corsStatusRes.error);
	const corsStatus = corsStatusRes.value;
	if ("cachedResponse" in corsStatus) {
		logger.debug("Returning cached response found through Cache Emulation");
		return okAsync({
			finalRespEarly: corsStatus.cachedResponse
		});
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
		return fmtNeverthrowErr("Failed to create the the request options", rewrittenReqOptsRes.error);
	/** The request options that will be used to fetch the site under the proxy*/
	const rewrittenReqOpts = rewrittenReqOptsRes.value;

	return okAsync({
		cacheMan,
		rewrittenReqOpts
	})
}