/**
 * @module
 * Aero's response headers rewriter
 */

// For enhanced type safety
import { type Maybe } from 'option-t/maybe';
/// Neverthrow types
import { ResultAsync } from "neverthrow";
import { okAsync } from "neverthrow";
import { fmtNeverthrowErr } from "$shared/fmtErr";

// Separate header rewriters
import { rewriteSetCookie } from "$sandbox/shared/cookie";
import { rewriteAuthServer } from "./auth";

// Utility
import rewriteSrc from "$util/src";

// Types for passthrough
import type { BareMux } from "@mercuryworkshop/bare-mux";
import type { rewrittenParamsOriginalsType } from "$types/commonPassthrough"

interface Passthrough {
	proxyUrl: URL;
	bc: BareMux.BareClient;
	clientId: string;
}

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

// TODO: Rewrite https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/SourceMap
/**
 * 
 * @param respHeaders The response headers to rewrite
 * @param proxyUrl The URL of the proxy
 * @param bc The BareMux client needed for some of the header rewriters
 * @param rewrittenParamsOriginals The original parameters that were rewritten for reference when correcting the `no-vary-search` header
 * @returns Anything needed to be inlined in the response rewriters later
 */
export default async function (
	respHeaders: Headers,
	rewrittenParamsOriginals: rewrittenParamsOriginalsType,
	accessControlRuleMap: Map<string, string>,
	passthrough: Passthrough,
): Promise<{
	/** Possibly the speculation rule if the external path to one had to have been deleted */
	speculationRules: Maybe<string>,
	sourcemapPath: Maybe<string>,
}> {
	const { proxyUrl, bc, clientId } = passthrough;

	/** Possibly the external speculation rules, but now inlined */
	let speculationRules: string;

	//const referrerPolicy = headers.get("referrer-policy");
	for (const [key, value] of Object.entries(respHeaders)) {
		if (ignoredHeaders.includes(key)) continue;

		switch (key) {
			case "location":
				respHeaders.set(key, rewriteLocation(value));
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
			// Inline the sourcemap in the external scripts as a comment instead of a header (so it can spawn another request)
			case "sourcemap":
				sourcemapPath = rewriteSrc(value);
				break;
			case "x-sourcemap":
				// `x-sourcemap` is deprecated
				respHeaders.set(key, rewriteSrc(value));
				break;
			case "access-control-allow-origin":
				if (CORS_EMULATION)
					// Delete the header and consider it in later requests with hooks in the proxy site
					accessControlRuleMap.set(clientId, value);
				break;
			case "speculation-rules":
				if (SUPPORT_SPECULATION) {
					/** @see https://developer.chrome.com/docs/web-platform/prerender-pages#speculation-rules-http-header */
					/** Force-inline the speculation rules later in *AeroSandbox* */
					/** We don't have to worry about not complying with the mandate for handling CSP for inline speculation rules because this was meant to be external, but it is being inlined now, so the header will be deleted */
					let extSpeculationRulesResp: Response;
					try {
						extSpeculationRulesResp = await bc.fetch(rewriteSrc(value, proxyUrl.origin));
					} catch (err) {
						return fmtNeverthrowErr("Failed to fetch the external speculation rules with intent to inline them", err.message);
					}
					speculationRules = await extSpeculationRulesResp.text();
					break;
				}
			case "no-vary-search":
				for (const [originalParam, rewrittenParam] of Object.entries(rewrittenParamsOriginals))
					respHeaders.set(key, replaceIdInNoVarySearchHeader(value, originalParam, rewrittenParam));
				break;
			case "reporting-endpoints":
				// TODO: Rewrite the URLs in the header value to be under the the proxy site
				/** @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Reporting-Endpoints */
				break;
			default:
				respHeaders.set(key, value);
		}

		let ret: {
			speculationRules?: string
		} = {};
		// @ts-ignore
		if (speculationRules) ret.speculationRules = speculationRules;
		return okAsync(ret);
	}

	// @ts-ignore
	return typeof speculationRules !== "undefined" ? okAsync(speculationRules) : okAsync(undefined);
};

/**
 * The rewriter for the `location` header
 * @param url The URL to rewrite (the original location header value)
 * @returns The rewritten URL (the new location header value) 
 */
function rewriteLocation(url: string): string {
	return self.location.origin + aeroConfig.prefix + url;
}

/** Match the quoted parameters inside of `params=()` for the rewriting the `no-vary-search` header  */
const matchIds = /params=\((?:"([^"]+)")(?:\s+"([^"]+)")*(?:\s*\))/;
/**
 * The rewriter for the `no-vary-search` header
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
