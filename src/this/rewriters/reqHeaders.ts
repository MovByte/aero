/**
 * @module
 * Aero's response headers rewriter
 */

import type { ResultAsync } from "neverthrow";
import { okAsync } from "neverthrow";
import { fmtNeverthrowErr } from "$aero/src/AeroSandbox/tests/shared/fmtErrTest";

//import { rewriteGetCookie } from "$sandbox/shared/cookie";
import { rewriteAuthClient } from "./auth";
import { afterPrefix } from "$sandbox/shared/getProxyUrl";

import getSiteDirective from "$sandbox/util/cors/siteTests";

import type BareClient from "@mercuryworkshop/bare-mux";


/** Things that are required to be passed in to rewrite the headers in the methods that are called from here */
interface Context {
	/** The proxy URL for reference in rewriting the headers */
	proxyUrl: URL;
	/** Also known as the full referrer URL */
	originFullUrl: URL;
	bc: BareClient;
}

/**
 * A function that rewrites the request headers for aero
 * @param headers The headers to rewrite
 */
export default async (headers: Headers, ctx: Context): Promise<ResultAsync<void, Error>> => {
	for (const [key, value] of headers.entries()) {
		if (key === "host") {
			headers.set(key, ctx.proxyUrl?.host);
			continue;
		}
		if (key === "origin") {
			headers.set(key, ctx.proxyUrl?.origin);
			continue;
		}
		if (key === "referrer") {
			headers.set(key, afterPrefix(value));
			continue;
		}
		// TODO: Ignore commas inside of quotes
		/*
		if (key === "cookie") {
			headers.set(key, rewriteGetCookie(value, proxyUrl));
			continue;
		}
		*/
		if (
			key === "authenticate"
		) {
			rewriteAuthClient(value, ctx.proxyUrl);
			continue;
		}
		if (key === "sec-fetch-site") {
			if (value === "none")
				continue;
			const proxifiedDirectiveRes = await getSiteDirective(ctx.proxyUrl, ctx.originFullUrl, ctx.bc);
			if (proxifiedDirectiveRes.isErr())
				// @ts-ignore
				return fmtNeverthrowErr("Failed to create and get the proxified site directive for rewriting the header Sec-Fetch-Site", proxifiedDirectiveRes.error.message);
			headers.set(key, proxifiedDirectiveRes.value);
			continue;
		}
		// Delete the `x-aero-*` headers
		if (key.startsWith("x-aero"))
			headers.delete(key);
	}
	return okAsync(undefined)
};
