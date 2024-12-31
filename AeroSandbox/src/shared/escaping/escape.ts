/**
 * @module
 * This module contains functions for escaping in proxies.
 * Not all of these exports are meant to be used inside of aero's SW, but some are. These include: `default` (escape) and `escapeWithOrigin`.
*/

import { proxyLocation } from "./proxyLocation;

import { eitherLogger } from "./Loggers";

/**
 * Forms a RegExp that can be used to escape a string with underscores and possibly with the origin as a prefix before the underscore
 * @param str The string to escape
 * @param origin Optionally, you can provide an origin to escape with. Likely `...proxifiedLocation.origin`
 * @returns The formed RegExp
 */
export default function (str: string, origin = ""): RegExp {
	return RegExp(`^(?:${origin}_+)?${str}$`, "g");
}

/**
 * Escape a string with an origin in the prefix; useful for isolation
 * @param str The string to escape
 * @param prefix The proxy prefix to escape with. Usually `aeroConfig.prefix`.
 * @param origin Defaults to the current proxy origin. Usually `...proxifiedLocation.origin`
 * @returns The escaped string with the origin
 **/
export function escapeWithOrigin(
	str: string,
	prefix = $aero.config.prefix,
	logger: eitherLogger = $aero.logger,
	origin = proxyLocation(prefix, logger).origin
): string {
	return `${origin}_${str}`;
}

/**
 * ...
 * @param str The string with the prefix to remove
 * @param prefix The proxy prefix to escape with. Usually `aeroConfig.prefix`.
 * @param origin Defaults to the current proxy origin. Usually `...proxifiedLocation.origin`
 * @returns The unescaped string with the origin
 */
export function unescapeWithOrigin(
	str: string,
	prefix = $aero.config.prefix,
	logger: eitherLogger = $aero.logger,
	origin = proxyLocation(prefix, logger).origin
) {
	return str.replace(new RegExp(`^${origin}_`), "");
}

/**
 * Although this is 
 * Class member key escaping is for when you want to proxify a class and you want to do something depending on what the constructor is, but you can't determine how the class was constructed earlier. A good example of this is in `xhr.ts` how the XHR methods work should behave differently if sync is enabled, which the browser knows when they process the XHR, but it isn't publicly visible through the XHR class itself
 */
export function createEscapePropGetHandler(): ProxyHandler<any> {
	/**
	 * @param escapedProps The properties to trap and escape
	 */
	// @ts-ignore
	return (escapedProps: readonly string[]) =>
		({
			// Unescape
			get(target, prop) {
				const stringProp = String(prop);
				return Reflect.get(target, escapedProps.includes(stringProp) ? unescape(target, stringProp, {
					keyword: $aero.config.sandbox.classMemberEscapeKeyword
				}) : stringProp);
			},
			// Escape
			set(target, prop) {
				const stringProp = String(prop);
				return escapedProps.includes(stringProp)
					? escapeGetTrap(target, prop, {
						keyword: $aero.config.sandbox.classMemberEscapeKeyword,
					})
					: Reflect.set(target, prop);
			}
			// biome-ignore lint/suspicious/noExplicitAny: for flexibility (is generic)
		}) as ProxyHandler<any>;
}


/**
 * Escape the prop (string) with the given escaped property with the given target from a getter trap
 * @param prop The property to escape'
 * @param escapeOptions The options to escape with
 * @returns The escaped prop (string)
 *
 * @example
 *  /* (define your escape keyword somewhere preferrably in your config) */
 *
 * set(target, prop) {
 *  const stringProp = String(prop);
 *  return escapedProps.includes(stringProp)
		*   ? escapeGetTrap(target, prop, {
			*    keyword,
			*   })
	*   : Reflect.set(target, prop);
 *}
 */
export function escapeGetTrap(
	target: any,
	prop: string,
	escapeOptions: EscapeWithKeywordOptions
): string {
	const { keyword, maxDepth, maxDepthChars } = escapeOptions; // TODO: Implement max depth support
	// TODO: Implement
	if (!ESCAPE_METHOD) {
		$aero.logger.fatalErr(
			"Missing the feature flag: ESCAPE_METHOD. Unable to determine how the properties should be escaped."
		);
	}
	if (ESCAPE_METHOD === "RegExp") {
		// TODO: Implement
		$aero.logger.fatalErr(
			'The ESCAPE_METHOD "Regexp" is a STUB, so please set it to JS instead'
		);
	}
	if (ESCAPE_KEYWORD === "JS") {
		// Until we find a suitable string
		for (let currentDepth = 1; ; currentDepth++) {
			const newProp =
				target[
				// TODO: Actually make this a config option
				keyword.repeat(
					currentDepth
				) + prop
				];
			const newPropIsUnique = !(newProp in target);
			if (newPropIsUnique)
				return newProp;
		}
	}
}

/**
 * Unescape string with the given keyword
 * @param str The string to unescape
 * @param escapeOptions The options to unescape with
 * @returns The unescaped string
 *
 * @example
 * ...(define your escape keyword somewhere preferrably in your config)
 *
 * get(target, prop) {
 *  const stringProp = String(prop);
 *  return Reflect.get(target, escapedProps.includes(stringProp) ? unescape(target, stringProp, {
 *   keyword: keyword
 *  }) : stringProp);
 * },
 */
export function unescape(str: string, escapeOptions: EscapeWithKeywordOptions) {
	const { keyword, maxDepth, maxDepthChars } = escapeOptions; // TODO: Implement max depth support
	if (!ESCAPE_METHOD) {
		$aero.logger.fatalErr(
			"Missing the feature flag: ESCAPE_METHOD. Unable to determine how the properties should be unescaped."
		);
	}
	if (ESCAPE_METHOD === "RegExp") {
		// TODO: Implement
		$aero.logger.fatalErr(
			'The ESCAPE_METHOD "Regexp" is a STUB, so please set it to JS instead'
		);
	}
	if (ESCAPE_METHOD === "JS") {
		const propSplitByEscapeKeyword = keyword.split(
			keyword
		);
		return propSplitByEscapeKeyword.shift();
	}
}
