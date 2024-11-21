/**
 * @module
 * This module contains rewriters for the cookie headers (both req/resp)
 * Neverthrow is used here because it contains potentially dangerous RegExp code
 */

import { Result, ok, err as nErr, Err } from "neverthrow";

/**
 * Rewrites the `cookie` header
 * @param cookieHeader The header to rewrite
 * @param proxyLoc The URL object to the real proxy URL (TODO: I may come up with a better name for this)
 * @param prefix The proxy prefix to be used
 * @returns The rewritten `cookie` header
 */
function rewriteGetCookie(cookieHeader: string, proxyLoc: URL, prefix: string): Result<string, Error> {
	try {
		return ok(cookieHeader
			.replace(
				new RegExp(
					`(?<=path\=)${prefix}${proxyLoc.origin}.*(?= )`,
					"g"
				),
				match =>
					match.replace(
						new RegExp(
							`^(${prefix}${proxyLoc.origin})`
						),
						""
					)
			)
			.replace(/_path\=.*(?= )/g, ""));
	} catch (err) {
		return fmtErrfailedToRewriteAHeader("get cookie", err.message);
	}
}
/**
 * Rewrites the `set-cookie` header
 * @param cookie The header to rewrite
 * @param proxyLoc The URL object to the real proxy URL
 * @param prefix The proxy prefix to be used
 * @return sThe rewritten `set-cookie` header
 */
function rewriteSetCookie(cookie: string, proxyLoc: URL, prefix: string): Result<string, Error> {
	try {
		// Escape the paths
		return ok(cookie.replace(
			/(?<=path\=).*(?= )/g,
			`${prefix}${proxyLoc.origin}$& _path=$&`
		));
	} catch (err) {
		return fmtErrfailedToRewriteAHeader("set cookie", err.message);
	}
}

/**
 * Creates `Neverthrow` Error when the rewriting of a header fails because of a RegExp error.
 * This is a helper method meant to be for internal-use only, but it is exposed just in case you want to use it for whatever reason.
 */
function fmtErrfailedToRewriteAHeader(headerType: string, errMsg: string): Err<string, Error> {
	return nErr(new Error(`Failed to rewrite the ${headerType} header (most likely a RegExp error)${ERR_LOG_AFTER_COLON}${errMsg}`));
}

export { rewriteGetCookie, rewriteSetCookie };
