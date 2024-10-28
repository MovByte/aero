/**
 * @module
 * This module is a part of escaping through the search params
*/

import type { SearchParamOptions } from "../../../../types/catch-all";

/**
 * There comes a problem when you want to rewrite a request something in the client, but you also want to ask the SW of a special request for what to do when it comes to handling that request.
 * This is where this function comes in.
 * It will append a search param to the URL that is unique to the search params that are already there. It will also escape the search param if it is already taken.
 * @param searchParams The search params to append to and escape for
 * @param searchParamOptions The options for configuring how the search param is escaped\
 * @param str The string to append to the search params
*/
export default (
    searchParams: URLSearchParams,
    searchParamOptions: SearchParamOptions,
    str: string
): void => {
    // Until a compatible search param is found
    const escapingCharCount = 0;
    for (; ;) {
        let escapesStr = "";
        for (let i = 0; i < escapingCharCount; i++)
            escapesStr += searchParamOptions.escapeKeyword;

        // Try the search param with yet another escapeChar
        const paramToTry = escapesStr + searchParamOptions.searchParam;
        if (!searchParams.has(paramToTry))
            return searchParams.set(paramToTry, str);
    }
};
