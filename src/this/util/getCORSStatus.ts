// Neverthrow
import type { ResultAsync } from "neverthrow";
import { okAsync, errAsync as errrAsync } from "neverthrow";
import { fmtNeverthrowErr } from "$sharedUtil/fmtErr";

// Passthrough types
import { Sec } from "$aero/types";

// Security
// CORS Emulation
import block from "./isolation/corsTesting";
// Cache Emulation
import HSTSCacheEmulation from "./isolation/HSTSCacheEmulation";
// TODO: Fix import - import clear from "./isolation/execClearEmulationOnWindowClients";
import CacheManager from "$aero/src/this/isolation/CacheManager";

// Utility
import redir from "$util/redir";

/**
 * This method also modifies the `sec` object you pass in accordingly
 * @param pass 
 * @returns An object containing every thing that is needed to continue, including the rewritten request and the client URL for later processing in `response.ts`
 */
export default async function getCORSStatus({
	reqUrl,
	reqHeaders,
	proxyUrl,
}: {
	/** The headers from the original request */
	reqHeaders: Headers;
	reqUrl: URL;
	proxyUrl: URL;
}, sec: Sec): Promise<ResultAsync<{
	cachedResponse: Response
} | {
	cacheMan: CacheManager
} | {}, Error>> {
	// Ensure the request isn't blocked by CORS
	if (FEATURES_CACHE_EMULATION) {
		const reqBlockedRes = await block(proxyUrl.href);
		if (reqBlockedRes.isErr())
			return fmtNeverthrowErr("Failed to deterine if the request should be blocked due to a would've been CORS violation", reqBlockedRes.error().message);
		// TODO: Print the context
		logger.log("Request blocked by CORS");
		return okAsync({
			cachedResponse: new Response("Blocked by CORS", { status: 500 })
		});
	}
	if (FEATURES_CORS_EMULATION) {
		// TODO: Implement with `policy.ts`
	}

	// Rewrite the request headers
	if (FEATURES_CACHE_EMULATION) {
		if (proxyUrl.protocol === "http:") {
			const hstsCacheEmulator = new HSTSCacheEmulation(
				reqHeaders.get("strict-transport-security"),
				proxyUrl.origin
			);

			const redirectRes = await hstsCacheEmulator.redirect();
			if (redirectRes.isErr())
				return fmtNeverthrowErr("Failed to determine if the client should redirect when using the cache emulator", redirectRes.error.message);
			const redirUrl = proxyUrl;
			redirUrl.protocol = "https:";
			return redir(redirUrl.href);
		}
	}

	if (FEATURES_CORS_EMULATION) {
		if (reqHeaders.has("timing-allow-origin"))
			sec.timing = reqHeaders.get("timing-allow-origin");
		if (reqHeaders.has("permissions-policy"))
			sec.perms = reqHeaders.get("permissions-policy");
		if (reqHeaders.has("x-frame-options"))
			sec.frame = reqHeaders.get("x-frame-options");
		if (reqHeaders.has("content-security-policy"))
			sec.csp = reqHeaders.get("content-security-policy");
	}

	/*
	FIXME:
	if (FEATURE_CLEAR_EMULATION && reqHeaders.get("clear-site-data")) {
		sec.clear = JSON.parse(`[${ reqHeaders.get("clear-site-data") }]`);
		if ("clear" in sec)
			await clear(sec.clear, await clients.get(event.clientId), proxyUrl);
	} else sec.clear = false;
	*/

	/** The manager for storing information needed for Cache Emulation */
	let cacheMan: CacheManager | undefined;
	if (FEATURES_CACHE_EMULATION) {
		cacheMan = new CacheManager(reqHeaders);

		if (cacheMan.mode === "only-if-cached")
			return errrAsync(new Error("Can't find an emulated cached response");

		const cacheAge = cacheMan.getAge(
			reqHeaders.get("cache-control"),
			reqHeaders.get("expires")
		);

		const cachedResp = await cacheMan.get(reqUrl, cacheAge);
		if (cachedResp) return okAsync({ cachedResp: cachedResp });
	}

	if (cacheMan)
		return okAsync({});
	return okAsync({ cacheMan });
}