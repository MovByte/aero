// Neverthrow
import type { ResultAsync } from "neverthrow";
import { okAsync } from "neverthrow";

// Passthrough type
import type CacheManager from "../isolation/CacheManager";

export default async function perfCacheSetting({
	cacheMan,
	reqUrlHref,
	rewrittenResp
}: {
	cacheMan: CacheManager, reqUrlHref: string, rewrittenResp: Response
}): Promise<ResultAsync<void, Error>> {
	// Cache the response
	const cacheManSetRes = await cacheMan.set(reqUrlHref, rewrittenResp, rewrittenResp.headers.get("vary"));
	if (cacheManSetRes.isErr())
		return fmtNeverthrowErr("Failed to set the new emulated cache", cacheManSetRes.error.message);
	return okAsync(undefined);
}