/**
 * @module
 * This module contains functions for escaping in proxies
*/

import { proxyLocation } from "$shared/proxyLocation";

import { AeroLogger, AeroSandboxLogger } from "../Loggers";

/**
 * Escapes a string with underscores
 *
 */
export default function(str: string, origin = ""): RegExp {
    return RegExp(`^(?:${origin}_+)?${str}$`, "g");
}

/**
 * Escape a string with an origin in the prefix; useful for isolation
 * @param str The string to escape
 * @param prefix The proxy prefix to escape with
 * @param logger The logger to use
 * @param origin Defaults to the current proxy origin.
 * @returns The escaped string with the origin
 **/
export function escapeWithOrigin(
    str: string,
    prefix: string,
    logger: AeroSandboxLogger | AeroLogger,
    origin = proxyLocation(prefix, logger).origin
): string {
    return `${origin}_${str}`;
}

/**
 * Class member key escaping is for when you want to proxify a class and you want to do something depending on what the constructor is, but you can't determine how the class was constructed earlier. A good example of this is in `xhr.ts` how the XHR methods work should behave differently if sync is enabled, which the browser knows when they process the XHR, but it isn't publicly visible through the XHR class itself
 */
export function createEscapePropGetHandler(): ProxyHandler<any> {
    /**
     * @param escapedProps The properties to trap and escape
     */
    // @ts-ignore
    return (escapedProps: string[]) =>
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

interface EscapeWithKeywordOptions {
    keyword: string;
    /** The maximum depth of keywords to exceed. I haven't found a use for this yet, but it is here if you need it. */
    maxDepth?: number;
    /** The maximum depth of chars to exceed (the number of characters behind the original string). I haven't found a use for this yet, but it is here if you need it. */
    maxDepthChars: number;
}

/**
 * Escape the prop (string) with the given escaped property with the given target from a getter trap
 * @param prop The property to escape'
 * @param escapeOptions The options to escape with
 * @returns The escaped prop (string)
 *
 * @example
 * ...(define your escape keyword somewhere preferrably in your config)
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
