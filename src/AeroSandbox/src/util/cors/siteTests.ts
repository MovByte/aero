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

const publicSuffixApi = "https://publicsuffix.org/list/public_suffix_list.dat";

/**
 * Gets the site directive of a URL by using the origin proxy URL as a reference
 * This function is made for emulating the `Sec-Fetch-Site` header 
 * @param proxyUrl The current navigation URL of the proxy (the proxy URL retrieved from the origin)
 * @param originUrl The URL to test against the proxy URL to see if the request is for the same origin
 * @returns The site directive. It will never return `none`, since you should return `none` if it is the same on the original header
 */
export default function getSiteDirective(originProxyUrl: URL, originUrl: URL, bc: BareClient = $aero.bc): sameSiteDirectives {
	if (new URL(originProxyUrl).origin === new URL(originUrl).origin) return "same-origin";
	if (isSameSite(originProxyUrl, originUrl, bc)) return "same-site";
	return "cross-site";
}

/**
 * Tests if the two URLs are the same site
 * @see https://developer.mozilla.org/en-US/docs/Glossary/Site
 * @param url1 - The first site to check
 * @param url2 - The second site to check
 * @param bareClient The bare-mux instance to use to fetch the public suffix list
 * @return 
 */
export async function isSameSite(url1: URL, url2: URL, bc: BareClient = $aero.bc): Promise<ResultAsync<boolean, Error>> {
	if (url1.protocol === url2.protocol) return okAsync(false);

	let publicSuffixesRes: Response;
	try {
		publicSuffixesRes = await bc.fetch(publicSuffixApi);
	} catch (err) {
		return fmtNeverthrowErr("Failed to fetch the public suffixes list for use in determining if the two URLs are the same site", err);
	}
	const publicSuffixesText = await publicSuffixesRes.text();
	const publicSuffixes = publicSuffixesText.split("\n").filter(line => !(line.startsWith("//") || line.trim() === ""));
	for (const publicSuffix of publicSuffixes) {
		/** If only the first level of the domain should be retrieved before the public suffixes */
		const firstLevelBeforeMatters = !publicSuffix.startsWith("*");
		const endsWithSuffix = url1.hostname.endsWith(publicSuffix) && url2.hostname.endsWith(publicSuffix);
		if (!endsWithSuffix)
			continue;
		if (
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