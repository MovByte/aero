// Neverthrow
import { ResultAsync, okAsync, errAsync as errrAsync } from "neverthrow";
import { fmtNeverthrowErr } from "$sharedUtil/fmtErr";

import type { Sec } from "$aero/types";

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

self.logger = new AeroLogger();

/**
 * Handles the requests
 * @param - The event
 * @returns  The proxified response
 */
async function handle(event: Assert<FetchEvent>): Promise<ResultAsync<Response, Error>> {
	// Sanity checks to ensure that everything has been initalized properly
	if (!("logger" in self))
		return errrAsync(new Error("The logger hasn't been initalized!"));
	if (!("aeroConfig" in self))
		throw errrAsync(new Error("There is no config provided. You need tocreate one."));

	// Develop a context
	const req = event.request;
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
		return okAsync(await fetch(req.url));
	}

	// Develop a context
	const params = reqUrl.searchParams;
	/** Used to determine if the request was made to load the homepage; this is needed so that the proxy will know when to rewrite the html files. For example, you wouldn't want it to rewrite a fetch request. */
	const isNavigate =
		req.mode === "navigate" &&
		["document", "iframe"].includes(req.destination);
	/** If the client is an iframe. This is used for determining the request url. */
	const isiFrame = req.destination === "iframe";
	let isMod: boolean;
	const isScript = req.destination === "script";
	if (isScript) {
		const isModParam = getPassthroughParam(params, "isMod");
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
		params,
		catchAllClientsValid,
		isNavigate
	})
	if (clientUrlRes.isErr())
		return fmtNeverthrowErr("Failed to get the client URL with aero's context", clientUrlRes.error.message);
	const clientUrl = clientUrlRes.value;
	if (clientUrl === "skip")
		return okAsync(await fetch(req.url));

	const getProxyURLRes = await getProxyURL({
		reqUrl,
		clientUrl,
		isNavigate,
		isiFrame
	});
	if (getProxyURLRes.isErr())
		return fmtNeverthrowErr("Failed to get the proxy URL", getProxyURLRes.error.message);
	const proxyUrl = getProxyURLRes.value;

	// Log request
	logger.log(
		req.destination === ""
			? `${req.method} ${proxyUrl.href}`
			: `${req.method} ${proxyUrl.href} (${req.destination})`
	);

	// Get sec out of here too
	const sec: Partial<Sec> = {};

	// Get the cache if it exists, and return it if it does or return null (use `Nullable` type from Option<t>) (make it so that you have to pass in the cache manager class as well)
	const corsStatusRes = await getCORSStatus({
		logger: AeroLogger,
		reqHeaders: req.headers,
		proxyUrl
	},
		// @ts-ignore: The types are compatible
		sec);
	if (corsStatusRes.isErr())
		return fmtNeverthrowErr("Failed to perform CORS emulation/testing", corsStatusRes.error.message);
	const corsStatus = corsStatusRes.value;
	if ("cachedResponse" in corsStatus)
		return okAsync(corsStatus.cachedResponse);
	const cacheMan = corsStatus.cacheMan;

	const rewrittenReqOptsRes = await formRequestOpts({
		req,
		clientUrl
	});
	if (rewrittenReqOptsRes.isErr())
		return fmtNeverthrowErr("Failed to create the the request options", rewrittenReqOptsRes.error.message);
	const rewrittenReqOpts = rewrittenReqOptsRes.value;

	// Make the request to the proxy
	const resp = await new BareMux.BareClient().fetch(
		new URL(proxyUrl).href,
		rewrittenReqOpts
	);

	if (!resp) return errrAsync(new Error("No response found"));
	if (resp instanceof Error) return errrAsync(Error);

	const rewriteRespRes = await rewriteResp({
		originalResp: resp,
		rewrittenReqHeaders: rewrittenReqOpts.headers,
		reqDestination: req.destination,
		proxyUrl,
		clientUrl,
		isNavigate,
		isMod,
		sec
	});
	if (rewriteRespRes.isErr())
		return fmtNeverthrowErr("Failed to rewrite the response", rewriteRespRes.error.message);
	const { rewrittenBody, rewrittenRespHeaders, rewrittenStatus } = rewriteRespRes.value;

	if (FEATURE_ENC_BODY_EMULATION)
		// This will modify the resp headers
		perfEncBodyEmu(originalResp, rewriteRespHeaders);

	const rewrittenResp = new Response(resp.status === 204 ? null : rewrittenBody, {
		headers: rewrittenRespHeaders,
		status: rewrittenStatus
	});

	if (FEATURE_CACHES_EMULATION) {
		const perfCacheSettingRes = perfCacheSetting({
			reqUrlHref: reqUrl.href,
			rewrittenResp,
			cacheMan
		})
		if (perfCacheSettingRes.isErr())
			return fmtNeverthrowErr("Failed to cache the response", perfCacheSettingRes.error.message);
	}

	// Return the response
	return okAsync(rewrittenResp);
}

self.aeroHandle = handle;
self.routeAero = (event: Assert<FetchEvent>): boolean => {
	return event.request.url.startsWith(location.origin + aeroConfig.prefix);
};
