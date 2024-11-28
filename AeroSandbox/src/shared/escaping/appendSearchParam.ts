/**
 * @module
 * This module is a part of escaping through the search params
*/

// TODO: Perhaps I should move this types into AeroSandbox instead
import type { SearchParamOptions } from "$aeroSW/types/catch-all";

import type { rewrittenParamsOriginalsType } from "$types/commonPassthrough"

/**
 * There comes a problem when you want to rewrite a request something in the client, but you also want to ask the SW of a special request for what to do when it comes to handling that request. That is where this function comes in. This method is versatile and is used in many areas of aero.
 * It will append a search param to the URL that is unique to the search params that are already there. It will also escape the search param if it is already taken.
 * @param searchParams The search params to append to and escape for
 * @param searchParamOptions The options for configuring how the search param is escaped
 * @param str The string to append to the search params
 * @param headers Response headers (if this is being ran in aero's SW handler) so that if any of the params specified in the `No-Vary-Search` header are escaped in the final versions of the params it wouldn't mess up the cache-excluding mechanism the header provides
*/
export default (
	searchParams: URLSearchParams,
	searchParamOptions: SearchParamOptions,
	str: string,
	/** This is mainly intended so that it could help the response header rewriter */
	rewrittenParamsOriginals?: rewrittenParamsOriginalsType
) => {
	// Until a compatible search param is found
	const escapingCharCount = 0;
	let escapesStr = "";

	for (; ;) {
		// Before we try one more level
		const paramBehind = escapesStr + searchParamOptions.searchParam;
		for (let i = 0; i < escapingCharCount; i++)
			escapesStr += searchParamOptions.escapeKeyword;
		// Try the search param with yet another escapeChar
		const paramToTry = escapesStr + searchParamOptions.searchParam;
		if (!searchParams.has(paramToTry)) {
			if (rewrittenParamsOriginals)
				rewrittenParamsOriginals[paramBehind] = paramToTry;
			searchParams.set(paramToTry, str);
			return {};
		}
	}
};
