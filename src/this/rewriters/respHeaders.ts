import { rewriteSetCookie } from "$sandbox/shared/cookie";
import { rewriteAuthServer } from "./auth";

const ignoredHeaders = [
    "cache-control",
    "clear-site-data",
    "content-encoding",
    "content-length",
    "content-security-policy",
    "content-security-policy-report-only",
    "cross-origin-resource-policy",
    "cross-origin-opener-policy",
    "cross-origin-opener-policy-report-only",
    "report-to",
    // TODO: Emulate these
    "strict-transport-security",
    "x-content-type-options",
    "x-frame-options"
];

function rewriteLocation(url: string): string {
    return self.location.origin + self.config.prefix + url;
}

// TODO: Rewrite https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/SourceMap
export default (
    headers: Headers,
    proxyUrl: URL,
    referrerPolicy: string
): void => {
    for (const [key, value] of headers.entries()) {
        if (ignoredHeaders.includes(key)) continue;

        switch (key) {
            case "location":
                headers.set(key, rewriteLocation(value));
                break;
            /*
            case "set-cookie":
                headers.set(key, rewriteSetCookie(value, proxyUrl));
                break;*/
            case "www-authenticate":
                rewriteAuthServer(value, proxyUrl); // Assumes this handles header setting
                break;
            // TODO: Emulate the referrer-policy header
            default:
                headers.set(key, value);
        }
    }
};
