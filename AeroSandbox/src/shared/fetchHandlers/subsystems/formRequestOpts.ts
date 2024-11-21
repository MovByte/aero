// Neverthrow
import type { ResultAsync } from "neverthrow";
import { okAsync, errAsync } from "neverthrow";
import { fmtNeverthrowErr } from "$shared/fmtErr";

// Utility
import rewriteReqHeaders from "$fetchHandlers/reqHeaders";

/**
 * This does header rewriting too
 * @param pass 
 * @returns An object containing every thing that is needed to continue, including the rewritten request and the client URL for later processing in `response.ts`
 */
export default async function rewriteReq({
	req,
	clientUrl,
}: {
	req: Request;
	clientUrl: string;
}): Promise<ResultAsync<RequestInit, Error>> {
	const rewrittenReqHeadersRes = await rewriteReqHeaders(req.headers, clientUrl);
	if (rewrittenReqHeadersRes.isErr())
		return fmtNeverthrowErr("Failed to rewrite the request headers", rewrittenReqHeadersRes.error.message);
	const rewrittenReqHeaders = rewrittenReqHeadersRes.value;

	/** The request options, but rewritten to be proxified for aero */
	const rewrittenReqOpts: RequestInit = {
		method: req.method,
		headers: rewrittenReqHeaders
	};

	// A request body should not be created under these conditions
	if (!["GET", "HEAD"].includes(req.method)) rewrittenReqOpts.body = req.body;

	return okAsync(rewrittenReqOpts);
}