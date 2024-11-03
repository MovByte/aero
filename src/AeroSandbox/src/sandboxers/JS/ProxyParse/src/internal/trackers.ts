import { inProxyType, proxyApplyTracker } from "../index.d.ts";

import { BlockDepthRefPassthrough, TrackPropertyChainRefPassthrough } from "../index.d.ts";

/**
 * Create a tracker for the property chain
 * @param blockDepth The current block depth
 * @param inPropertyChain Are we currently in a property chain?
 * @param propertyChainEnded Has the property chain has ended?
 * @param currentChain The current chain we are ready to keep track of
 */
export function createPropertyChainTracker(blockDepthRefPassthrough: Partial<BlockDepthRefPassthrough>, trackPropertyChainRefPassthrough: Partial<TrackPropertyChainRefPassthrough>) {
    return (char: string) => {
        trackPropertyChainRefPassthrough.propertyChainEnded = false;

        const checkIfCharDenotesComputedAccess = createCheckIfCharDenotesComputedAccess();
        if (checkIfCharDenotesComputedAccess(char) && blockDepthRefPassthrough.blockDepth > 0) {
            trackPropertyChainRefPassthrough.currentChain += char;
            trackPropertyChainRefPassthrough.inPropertyChain = true;
        } else {
            trackPropertyChainRefPassthrough.propertyChainEnded = true;

            // Reset chain tracking
            trackPropertyChainRefPassthrough.currentChain = "";
            trackPropertyChainRefPassthrough.inPropertyChain = false;
        }

        return {
            char,
            inPropertyChain: trackPropertyChainRefPassthrough.inPropertyChain,
            currentChain: trackPropertyChainRefPassthrough.currentChain,
			propertyChainEnded: trackPropertyChainRefPassthrough.propertyChainEnded,s
        };
    }
}

/** RegExp that matches a character that would be valid in a variable name */
const validVarCharRegEx = /[a-zA-Z_$]/;
/**
 * Creates a checker to determine if the a character denotes computed access
 * @returns The handler to check if the given character denotes computed access
 */
function createCheckIfCharDenotesComputedAccess(): createCheckIfCharDenotesComputedAccess {
    let bracketDepth = 0;
    let wasInComputedAccessLastTime = false;
    return (char: string): boolean => {
        if (char === '[') {
            bracketDepth++;
            wasInComputedAccessLastTime = true;
            return true;
        }
        else if (char === ']') {
            bracketDepth--;
            if (wasInComputedAccessLastTime)
                return true;
        }
        /** Check if it is computed excluding the bracket checks since that was just already checked */
        const isComputed = char === '.' || validVarCharRegEx.test(char);
        if (isComputed) {
            return true;
        } else {
            // Since we are out of it we need to reset the bracket depth for use in next time
            bracketDepth = 0;

            return false;
        }
    }
}

/**
 * Create a tracker for the `Proxy` object and its apply handler
 * @returns The tracker for the `Proxy` object and its apply handler
 */
export function createProxyApplyTracker(): proxyApplyTracker {
    // For `Proxy` object tracking
    /** Track the `Proxy` object  */
    let inProxy: inProxyType = false;
    /** Track the apply handlers (including its function body) and the `Proxy` object  */
    let inApply = false;

    /** Track the end of the parameter list */
    let applyHandlerParamListEnded = false;

    // Depth checkers for `Proxy` object constructor tracking
    /** For looking at the parameters in the `Proxy` constructor */
    let inProxyParenDepth = 0;
    /** In the block for the object in the second parameter of the `Proxy` constructor */
    let inProxyBraceDepth = 0;
    // Depth checkers for `Proxy` object apply handler tracking (a property in the object passed into the second parameter of the `Proxy` constructor)
    let inApplyParenDepth = 0;
    /** In the block for the apply handler (body of the method) in object in the second parameter of the `Proxy` constructor */
    let inApplyBodyBraceDepth = 0;

    // Flags for tracking where in the `Proxy` object handler we are
    /** A flag for tracking if you are in a `Proxy` object */
    let inProxyTrackingHandler = false
    /** A flag for tracking if you are in the apply handler for the `Proxy` object */
    let inApplyBody = false;

    // Sequence Trackers for `Proxy` object tracking
    /** A sequence trackers for the `Proxy` object when constructed by `new Proxy` */
    const isNewProxy = trackSeq("new Proxy");
    /** A sequence trackers for the `Proxy` object when created by `Proxy.revocable` */
    const isProxyRevocable = trackSeq("Proxy.revocable")
    /** A sequence trackers for the `apply` handler in the `Proxy` object */
    const isApply = trackSeq("apply");

    return (char: string): object | void => {
        if (inProxy) {
            // Updating counters for the parentheses in the `Proxy` constructor
            if (char === '(') inProxyParenDepth++;
            if (char === ')') inProxyParenDepth--;

            // Detect the start of the handler object (in the second argument). We are hoping to find the apply handler.
            if (inProxyParenDepth === 1 && char === ",") inProxyTrackingHandler = true;

            if (inProxyTrackingHandler) {
                // Update counters for the blocks
                if (char === "{") inProxyBraceDepth++;
                if (char === "}") inProxyBraceDepth++;

                // Look for the parameter list and function body inside of the `apply` handler for tracking purposes
                if (inApply) {
                    if (applyHandlerParamListEnded) {
                        // `apply` function body starts with the first `{` after parameters end
                        if (inApplyBody) {
                            // Update counters for the blocks
                            if (char === "{") inApplyBodyBraceDepth++;
                            if (char === "}") inApplyBodyBraceDepth--;

                            // Detect the end of the `apply` handler body
                            if (inApplyBodyBraceDepth === 0) {
                                inApply = false;
                                inApplyBody = false;
                                return {
                                    char,
                                    inProxyTrackingHandler, // Is it tracking the handler object?
                                    inProxy,
                                    inApply,
                                    inApplyBody,
                                    exitingApplyBody: true // Is it just now exiting the apply body?
                                };
                            }
                        }
                        else if (char === "{") {
                            inApplyBody = true;
                            return {
                                char,
                                inProxyTrackingHandler, // Is it tracking the handler object?
                                inProxy,
                                inApply,
                                inApplyBody,
                                enteringApplyBody: true // Is it just now entering the apply body?
                            };
                        }
                        return {
                            char,
                            inProxyTrackingHandler, // Is it tracking the handler object?
                            inProxy,
                            inApply,
                            inApplyBody,
                        };
                    } else {
                        // We need to keep track of the parameter list because it may be possible that a default parameter is set to an object, which would throw off the parser into thinking that the object is the apply handler's body itself.

                        // Update counters for the parentheses denoting the parameter list
                        if (char === "(") inApplyParenDepth++;
                        if (char === ")") inApplyParenDepth--;

                        // Ignore nested braces in default parameters (e.g. `target = {}`)
                        if (char === '{' && inApplyParenDepth > 0) inApplyBodyBraceDepth++;
                        if (char === '}' && inApplyParenDepth > 0) inApplyBodyBraceDepth--;

                        // The parameter list ends once `inApplyParenDepth` is back to zero
                        if (inApplyParenDepth === 0 && char === ')') applyHandlerParamListEnded = true;
                    }
                }
                // Detect the start of the apply handler through tracking its function signature
                else if (isApply(char) && inProxyBraceDepth > 0) {
                    // Start tracking the apply handler
                    inApply = true;
                    applyHandlerParamListEnded = false;
                    return {
                        char,
                        inProxyTrackingHandler, // Is it tracking the handler object?
                        inProxy,
                        inApply
                    };
                }

                // End handler tracking when handler braces close
                if (inProxyBraceDepth === 0 && char === "}") {
                    inProxyTrackingHandler = false;
                    inProxy = false;
                    inApply = false;
                    return {
                        char,
                        inProxyTrackingHandler,
                        inProxy,
                        inApply,
                        exitingProxyHandler: true
                    };
                }
            }
            // Begin tracking the blocks so we know when the handler object ends
        }
        if (isNewProxy(char)) {
            inProxy = "class";
            return {
                char,
                inProxy
            };
        }
        if (isProxyRevocable(char)) {
            inProxy = "revocable";
            return {
                char,
                inProxy
            };
        }
    }
}

/**
 * Tracks character sequences
 * This is used internally within this file to track the `Proxy` object and its apply handler.
 * @param targetSeq The target sequence to track
 * @returns A handler that tracks the sequence for the given target sequence. It has a boolean response, which is `true` when the target sequence is matched, then resets the sequence
 */
export function trackSeq(targetSeq: string): (char: string) => boolean {
    let currSeq = "";
    return (char) => {
        currSeq += char;
        if (currSeq.length > targetSeq.length)
            currSeq = currSeq.slice(1);
        return currSeq === targetSeq;
    }
}