import type { ResultAsync } from "neverthrow";
import { okAsync, errAsync } from "neverthrow";
import { fmtNeverthrowErr } from "$util/fmtErr";

import type { BareMux } from "@mercuryworkshop/bare-mux";


// Utility
import getPassthroughParam from "$sharedUtil/getPassthroughParam";
import getRequestUrl from "$sharedUtil/getRequestUrl";
import rewriteReqHeaders from "$rewriters/reqHeaders";

/**
 * This does header rewriting too
 * @param pass 
 * @returns An object containing every thing that is needed to continue, including the rewritten request and the client URL for later processing in `response.ts`
 */
export default async function rewriteReq({
	reqHeaders,
	reqMethod,
	clientUrl,
	bc,
}: {
	reqHeaders: Headers;
	reqMethod: string;
	clientUrl: string;
	bc: BareMux;
}): Promise<ResultAsync<rewrittenReqOpts, Error>> {
	const rewrittenReqHeadersRes = await rewriteReqHeaders(reqHeaders, clientUrl);
	if (rewrittenReqHeadersRes.isErr())
		return fmtNeverthrowErr("Failed to rewrite the request headers", rewrittenReqHeadersRes.error.message);

	/** The request options, but rewritten to be proxified for aero */
	const rewrittenReqOpts: RequestInit = {
		method: req.method,
		headers: rewrittenReqHeaders
	};

	// A request body should not be created under these conditions
	if (!["GET", "HEAD"].includes(req.method)) rewrittenReqOpts.body = req.body;

	return okAsync(rewrittenReqOpts);
}