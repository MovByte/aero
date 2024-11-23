/**
 * @module
 * This module contains rewriters for the auth headers (both req/resp)
*/

/**
 * Rewrites the `www-authenticate` header
 * @param header - The header to rewrite
 * @param proxyUrl - The url to be proxied
*/
function rewriteAuthServer(header: string, proxyUrl: URL): string {
    return header
        .split(",")
        .map(dir => {
            const domainMatch = dir.match(/domain="(.*)"/g);
            // TODO: Rewrite
            if (domainMatch !== null) return dir;
        })
        .join(",");
}

/**
 * Rewrites the `authentication` header
 * @param header - The header to rewrite
 * @param proxyUrl - The url to be proxied
*/
function rewriteAuthClient(header: string, proxyUrl: URL): string {
    // TODO: Support
    return header
        .split(",")
        .map(dir => {
            if (dir === "domain") return dir;
        })
        .join(",");
}

export { rewriteAuthServer, rewriteAuthClient };
