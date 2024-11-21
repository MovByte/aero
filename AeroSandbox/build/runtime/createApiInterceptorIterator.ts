import type { APIInterceptor } from "../types/apiInterceptors";

import apiInterceptorsPath from "./apiInterceptorsPath";

/**
 * Allows you to iterate over API interceptors in Webpack (client)
 * @param patterns list of glob patterns for files, where the API Interceptors are, to include
 * @param ignoreList The list of glob patterns for files to ignore
 * @param
 * @returns An iterable of API interceptors
 * @example
 * import createApiInterceptorIterator from "...";
 * ...
 * for (const apiInterceptor of createApiInterceptorIterator()) {
 * 	...
 * }
 */
export default (
	includeRegExp: RegExp,
	path = apiInterceptorsPath
): Iterable<APIInterceptor> => {
	// TODO: Define Rspack types on this file
	const ctx = import.meta.webpackContext(path, {
		regExp: includeRegExp
	});

	return {
		*[Symbol.iterator]() {
			for (const fileName of ctx.keys()) yield ctx(fileName);
		}
	} as Iterable<APIInterceptor>;
};
