import { getProxyConfig } from "$aero/src/shared/getConfig";

import { proxyLocation } from "./proxyLocation";

import { AeroSandboxLogger, AeroLogger } from "./Loggers";

const protocolRegExp = /^https?:\/\//;

/**
 * This should not be used for processed html attributes, rather rewriteSrcHtml.
 * This function isn't used often anymore, since most use of it has been replaced by Catch-all SW Request URL Interception.
 * @param The url to rewrite
 * @param The prefix to add to the url
 * @param The logger to use
 * @param The proxy href location to use
 * @returns The rewritten url
 */
function rewriteSrc(url: string, prefix: string, logger: AeroSandboxLogger | AeroLogger, proxyHref = proxyLocation(prefix, logger).href): string {
    // Protocol
    const rewrittenUrl = protocolRegExp.test(url)
        ? prefix + url
        : new URL(url, proxyHref).href;

    return rewrittenUrl;
}

export default rewriteSrc;
