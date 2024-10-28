import { Result, ok, err as errr } from "neverthrow";

/**
 * @module
 * This module contains rewriters for the cookie headers (both req/resp)
 * Neverthrow is used here because it contains potentially dangerous RegExp code
 */

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
        return errr(new Error(`Failed to rewrite the get cookie header: ${err.message}`));
    }
}
/**
 * Rewrites the `set-cookie` header
 * @param The header to rewrite
 * @param The URL object to the real proxy URL
 * @param The proxy prefix to be used
 * @returnsThe rewritten `set-cookie` header
 */
function rewriteSetCookie(cookie: string, proxyLoc: URL, prefix: string): Result<string, Error> {
    try {
        return ok(cookie.replace(
            /(?<=path\=).*(?= )/g,
            `${prefix}${proxyLoc.origin}$& _path=$&`
        ));
    } catch (err) {
        return errr(new Error(`Failed to rewrite the set cookie header: ${err.message}`));
    }
}

export { rewriteGetCookie, rewriteSetCookie };
