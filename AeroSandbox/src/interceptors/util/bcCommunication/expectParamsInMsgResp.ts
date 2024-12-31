/**
 * @module
 * TODO: This module contains functions meant...
 */

/**
 * This is for runtime sanity checking of the properties of a message response from a broadcast channel
 * @param what 
 * @param expectedProps 
 * @param eventToCheck
 * @throws {Error} If a property is missing 
 */
export function throwMissingPropExpectedOfBC(purpose: string, expectedProps: string[], eventToCheck: Event) {
	for (const prop of expectedProps)
		if (!(prop in eventToCheck))
			throw new Error(`The broadcast channel response message for ${purpose} is missing the \`${prop}\` property on the event data!`);
}

/**
 * This is a helper method for when using `getMsgFromSw` to format the error message for when a property is missing (you should use this)
 * @param prop What is missing
 * @param prop The property that is missing
 */
export function fmtMissingPropExpectedOfSW(what: string, prop: string): string {
	return fmtMissingPropExpectedOfGeneric(what, "the aero SW handler", prop);
}

/**
 * @param prop The property that is missing
 */
function fmtMissingPropExpectedOfGeneric(what: string, of: string, prop: string): string {
	return `The ${what} is missing the (expected of ${of}) \`${prop}\` property!`;
}