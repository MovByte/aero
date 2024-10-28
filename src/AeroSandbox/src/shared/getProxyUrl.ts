/**
 * @module
 * These methods allow the API Interceptors to get the proxy URL from the real URL
 * Please look at the Index of the Dev Docs to understand the difference between a proxy URL and a real URL
*/

import { AeroLogger, AeroSandboxLogger } from "./Loggers";

/*
 * Separates the prefix from the url to get the proxy url isolated
 * This is primarily used for concealers
*/
function afterPrefix(realURL: string, prefix: string, logger: AeroSandboxLogger | AeroLogger) {
    logger.log(`${location.origin}${prefix}`);
    return realURL.replace(
        new RegExp(`^(${location.origin}${prefix})`, "g"),
        ""
    );
}

/**
 * Get whatever is after the current document's origin in a URL (usually to get the proxy URL)
 * @param realURL - The URL to get (likely) the proxy URL from
 * @returns The URL after the current document's origin
*/
function afterOrigin(realURL: string): string {
    return realURL.replace(new RegExp(`^(${location.origin})`, "g"), "");
}

export { afterPrefix, afterOrigin };
