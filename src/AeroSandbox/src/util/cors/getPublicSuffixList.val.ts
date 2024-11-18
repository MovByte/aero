/**
 * This file is meant to be loaded with `val-loader` and is meant to be compile-time preprocessing in place of the `getPublicSuffixList` function in `siteTests.ts` if the feature flag `getPublicSuffixListMethods`'s first array element contains `compileTime`.
 * This method fetches and parses the list of public suffixes from @see https://publicsuffix.org/list/public_suffix_list.dat.
 */

import createErrorFmters from "../fmtErrGeneric";

/* These should be passed in the options of the `val-loader` plugin instance */
interface ValOptions {
	/* This is from the feature flags */
	errorLogAfterColon: string;
	/* This is from the feature flags */
	publicSuffixApi: string;
	/* This is from the feature flags */
	failedToFetchSuffixErrMsg: string;
}

/**
 * Gets the parsed public suffix list from the public suffix API
 * @param errorLogAfterColon 
 * @returns 
 * @throws {Error} Throws an error the public suffixes list could not be fetched. The reason why this Error isn't wrapped with *Neverthrow* is because this is a compile-time method and the error should be thrown at compile-time. There is no need for invalid builds.
 */
export default async function ({ errorLogAfterColon, publicSuffixApi, failedToFetchSuffixErrMsg }: ValOptions): string[] {
	const { fmtErr } = createErrorFmters(errorLogAfterColon);

	// Try to get the public suffixes list
	let publicSuffixesRes: Response;
	try {
		publicSuffixesRes = await fetch(publicSuffixApi);
	} catch (err) {
		throw fmtErr(failedToFetchSuffixErrMsg, err);
	}
	/** The public suffixes list - @see https://publicsuffix.org/ */
	const publicSuffixesText = await publicSuffixesRes.text();
	return publicSuffixesText.split("\n").filter(line => !(line.startsWith("//") || line.trim() === ""));
}