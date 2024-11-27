/**
 * @module
 * Aero's response headers rewriter
 */

import { rewriteSetCookie } from "$sandbox/shared/cookie";
import { rewriteAuthServer } from "./auth";

import type { BareMux } from "@mercuryworkshop/bare-mux";

import type { rewrittenParamsOriginalsType } from "$types/commonPassthrough"

/**
 * Headers that are removed from the proxy
 */
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
	return self.location.origin + aeroConfig.prefix + url;
}


// TODO: Rewrite https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/SourceMap
export default (
	headers: Headers,
	proxyUrl: URL,
	bc: BareMux.BareClient,
	rewrittenParamsOriginals: rewrittenParamsOriginalsType
): void => {
	//const referrerPolicy = headers.get("referrer-policy");
	for (const [key, value] of Object.entries(headers)) {
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
			case "referrer-policy":
				// TODO: Emulate the referrer-policy header and force-referrer
				break;
			case "no-vary-search":
				for (const [originalParam, rewrittenParam] of Object.entries(rewrittenParamsOriginals))
					headers.set(key, replaceIdInNoVarySearchHeader(value, originalParam, rewrittenParam));
				break;
			case "reporting-endpoints":
				// TODO: Rewrite the URLs in the header value to be under the the proxy site
				/** @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Reporting-Endpoints */
				break;
			default:
				headers.set(key, value);
		}
	}
};

/** Match the quoted parameters inside of `params=()` */
const matchIds = /params=\((?:"([^"]+)")(?:\s+"([^"]+)")*(?:\s*\))/;
/**
 * @param value The value of the `no-vary-search` header
 * @param matchId The ID to match
 * @param replacmentId The ID to replace the matched ID with
 * @returns The updated `no-vary-search` header value (something like `params=()`)
 */
function replaceIdInNoVarySearchHeader(value: string, matchId: string, replacmentId: string): string {
	return value.replace(matchIds, (_match, ...groups) => {
		// Extract the parameters from the matched groups while ignoring non-param matches like index and index from the capture groups
		const params = groups.slice(0, -2);
		const updatedParams = params
			.map(param => (param === matchId ? replacmentId : param))
			// Surround the new ID values with quotes like from before
			.map(param => `"${param}"`)
			.join(" ");

		// Return the updated `params=()`
		return `params=(${updatedParams})`;
	});
}
