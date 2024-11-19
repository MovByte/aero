/**
 * @module
 * This module contains tests to see if the two URLs (proxy URL and origin URL) are under the same site
 * This module is made for rewriting the `Sec-Fetch-Site`
 */

import { ResultAsync } from "neverthrow";
import { okAsync } from "neverthrow";
import { fmtNeverthrowErr } from "../fmtErr";

import type BareClient from "@mercuryworkshop/bare-mux";

/** The site directives as per @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Sec-Fetch-Site#directives */
type sameSiteDirectives = "cross-site" | "same-origin" | "same-site" | "none";

/**
 * Gets the site directive of a URL by using the origin proxy URL as a reference
 * This function is made for emulating the `Sec-Fetch-Site` header 
 * @param proxyUrl The current navigation URL of the proxy (the proxy URL retrieved from the origin)
 * @param clientURL The URL to test against the proxy URL to see if the request is for the same origin
 * @param bc The bare-mux instance to use to fetch the public suffix list
 * @returns The site directive. It will never return `none`, since you should return `none` if it is the same on the original header
 */
export default function getSiteDirective(proxyUrl: URL, clientURL: URL, bc: BareClient = $aero.bc): sameSiteDirectives {
	if (new URL(proxyUrl).origin === new URL(clientURL).origin) return "same-origin";
	if (isSameSite(proxyUrl, clientURL, bc)) return "same-site";
	return "cross-site";
}

/**
 * Tests if the two URLs are the same site
 * @see https://developer.mozilla.org/en-US/docs/Glossary/Site
 * @param url1 - The first site to check
 * @param url2 - The second site to check
 * @param bc The bare-mux instance to use to fetch the public suffix list
 * @return If the two URLs are the same site wrapped in a `ResultAsync` for better error handling from *Neverthrow*
 */
export async function isSameSite(url1: URL, url2: URL, bc: BareClient = $aero.bc): Promise<ResultAsync<boolean, Error>> {
	if (url1.protocol === url2.protocol) return okAsync(false);

	let publicSuffixes: string[];
	if (FETCH_PUBLIC_SUFFIX_PRIORITY === "compile-time") {
		const { default: getPublicSuffixListCompileTime } = await import("./getPublicSuffixList.val");
		publicSuffixes = getPublicSuffixListCompileTime({ errLogAfterColon: ERR_LOG_AFTER_COLON, publicSuffixApi: PUBLIC_SUFFIX_API, failedToFetchSuffixErrMsg: FAILED_TO_FETCH_SUFFIX_ERR_MSG });
	}
	else if (FETCH_PUBLIC_SUFFIX_PRIORITY === "run-time") {
		const publicSuffixesRes = await getPublicSuffixList(bc);
		if (publicSuffixesRes.isErr())
			return fmtNeverthrowErr("Failed to get the public suffixes list", publicSuffixesRes.error.message);
		publicSuffixes = publicSuffixesRes.value;
	} else {
		return fmtNeverthrowErr(`Failed to get the feature flag "fetchPublicSuffixPriority"`, "The feature flag is not set to either `compile-time` or `run-time`");
	}

	for (const publicSuffix of publicSuffixes) {
		/** If only the first level of the domain should be retrieved before the public suffixes */
		const firstLevelBeforeMatters = !publicSuffix.startsWith("*");
		/** If both urls end with the same public suffix */
		const endsWithSuffix = url1.hostname.endsWith(publicSuffix) && url2.hostname.endsWith(publicSuffix);
		if (!endsWithSuffix)
			// If the URL does not end with the public suffix, it doesn't matter
			continue;
		if (
			// Check if the public suffix domain are both equal (the first level before the public suffix matters)
			getSiteDomainFromPublicSuffix(url1, publicSuffix, firstLevelBeforeMatters) === getSiteDomainFromPublicSuffix(url2, publicSuffix, firstLevelBeforeMatters))
			return okAsync(true);
	}
	// Finally, check if the second-level domains are equal
	return okAsync(getSecondLevelDomain(url1) === getSecondLevelDomain(url2))
}

/**
 * Gets the site domain from the public suffix.
 * This is a helper function meant to be for internal-use only, but it is exposed just in case you want to use it for whatever reason.
 * @param url The URL to get the site domain from using the public suffix
 * @param publicSuffix The public suffix to get the site domain from
 * @param getOnlyFirstLevelAfter Get only the first domain level before the public suffix
 * @returns The site domain from the public suffix
 */
function getSiteDomainFromPublicSuffix(url: URL, publicSuffix: string, getOnlyFirstLevelAfter: boolean): string {
	/** All of the levels before the public suffix */
	const allLevelsAfter = url.hostname.split(publicSuffix).pop();
	return getOnlyFirstLevelAfter ? allLevelsAfter.split(".").at(-1) : allLevelsAfter;
}

/**
 * Gets the second level domain of a URL.
 * This is a helper function meant to be for internal-use only, but it is exposed just in case you want to use it for whatever reason.
 * @url The URL to get the second level domain from
 * @returns the second level domain of the given URL
 */
function getSecondLevelDomain(url: URL): string {
	return url.hostname.split(".").at(-2);
}

/**
 * Gets the parsed public suffix list from the public suffix API
 * @param bc The bare-mux instance to use to fetch the public suffix list
 * @returns The public suffixes list (parsed) wrapped in a `ResultAsync` for better error handling from *Neverthrow*
 */
export async function getPublicSuffixList(bc: BareClient = $aero.bc): Promise<ResultAsync<string[], Error>> {
	// Try to get the public suffixes list
	let publicSuffixesRes: Response;
	try {
		publicSuffixesRes = await bc.fetch(PUBLIC_SUFFIX_API);
	} catch (err) {
		return fmtNeverthrowErr(FAILED_TO_FETCH_SUFFIX_ERR_MSG, err);
	}
	/** The public suffixes list - @see https://publicsuffix.org/ */
	const publicSuffixesText = await publicSuffixesRes.text();
	return okAsync(publicSuffixesText.split("\n").filter(line => !(line.startsWith("//") || line.trim() === "")));
}
