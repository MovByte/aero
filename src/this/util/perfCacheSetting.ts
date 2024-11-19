// Neverthrow
import type { ResultAsync } from "neverthrow";
import { okAsync } from "neverthrow";

// Passthrough type
import type CacheManager from "../isolation/CacheManager";
import { fmtNeverthrowErr } from "$aero/src/AeroSandbox/tests/shared/fmtErrTest";

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
	const cacheManSetRes = await cacheMan.set(reqUrlHref, rewrittenResp,);
	if (cacheManSetRes.isErr())
		return fmtNeverthrowErr("Failed to set the new emulated cache", cacheManSetRes.error.message);
	logger.log("Cached the response: ", rewrittenResp);
	return okAsync(undefined);
}