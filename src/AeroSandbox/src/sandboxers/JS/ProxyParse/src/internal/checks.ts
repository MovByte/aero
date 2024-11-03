/**
 * @module
 * This module contains various checks used internally by the ProxyParse library.
 * There is no reason to use these yourself unless you are making your own implementation of ProxyParse.
 */

/**
 * Checks if the given chain contains ambiguous access to the `window` or `location` object
 * @param chain The chain to check
 * @returns Whether the chain contains ambiguous access
 *
 * @example
 * ...else if (
 *  currentChain !== null
 * ) {
 *  if (propertyChainEnded) {
 *   // If the chain contains `window` or `location`, wrap with the check function provided
 *   if (containsAmbiguousAccess(currentChain)) {
 *    res += `${config.checkFuncPropTree}(${currentChain})`;
 *   } else {
 *    // No wrapping needed; append the chain as-is
 *    res += currentChain;
 *   }
 *  } else {
 *   // We need to wait and see what happens next
 *   continue;
 *  }
 * }
 */
export function containsAmbiguousAccess(chain: string): boolean {
    // Check for `window` or `location` in a chain
    return /window|location/.test(chain);
}