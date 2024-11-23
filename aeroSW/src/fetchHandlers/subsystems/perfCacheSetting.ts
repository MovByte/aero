// Neverthrow
import type { ResultAsync } from "neverthrow";
import { okAsync } from "neverthrow";

// Passthrough type
import type CacheManager from "../isolation/CacheManager";
import { fmtNeverthrowErr } from "$aero/AeroSandbox/tests/shared/fmtErrTest";

/**
 * Performs cache setting for the final Response before it is sent to the client
 * @param param0 The passthrough object needed for the cache setting
 * @returns A `ResultAsync` from *Nevethrow* that resolves to nothing
 */
export default async function perfCacheSetting({
	cacheMan,
	reqUrlHref,
	rewrittenResp
}: {
	cacheMan: CacheManager, reqUrlHref: string, rewrittenResp: Response
}): Promise<ResultAsync<void, Error>> {
	const varyHeader = rewrittenResp.headers.get("vary");
	if (varyHeader === null)
		// Skip (we don't need to cache this)
		return okAsync(undefined);
	// Cache the response
	const cacheManSetRes = await cacheMan.set(reqUrlHref, rewrittenResp, varyHeader);
	if (cacheManSetRes.isErr())
		return fmtNeverthrowErr("Failed to set the new emulated cache", cacheManSetRes.error.message);
	logger.debug("Cached the response: ", rewrittenResp);
	return okAsync(undefined);
}