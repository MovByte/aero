/**
 * @module
 * You can find this module on `aero-sandbox/proxy-parse-js/keywordGenerator` on *NPM* or *JSR*
 */

import type {
    BlockDepthRefPassthrough,
    TrackPropertyChainRefPassthrough,
    InitHandlersRefPassthrough,
    KeywordGenConfig,
    TrackerConfig
} from "./index.d.ts";
import { createHandleEscapeChars, StringSpecificHandlers, processStatement } from "./internal/handlers";
import { createBlockDepthCounter } from "./internal/counters";
import { createPropertyChainTracker, createProxyApplyTracker } from "./internal/trackers"

/**
 * Allows you to incrementally parse parts of the script with distinction, where you can later use the results to replace keywords with the methods provided by *ProxyParse* in replaceKeyword
 * @param script The script to process
 * @param config The configuration for keyword iteration
 * @param config The configuration for keyword iteration
 */
export default function* processKeyword(script: string, config: {
    keywordGenConfig: KeywordGenConfig,
    trackers: TrackerConfig
}) {
    /** Stores the final result after processing */
    let res = "";

    /** Is the character the first character in a new statement? (e.g. `;` or `}` or `(`) */
    let inNewStatement = true;

    let blockDepthRefPassthrough: Partial<BlockDepthRefPassthrough> = {};
    if (config.trackers.blockDepth ||
        // This system requires trackPropertyChain, so might as well include it
        config.trackers.propertyChain)
        blockDepthRefPassthrough.blockDepth = 0;

    let trackPropertyChainRefPassthrough: Partial<TrackPropertyChainRefPassthrough> = {};
    if (config.trackers.propertyChain) {
        trackPropertyChainRefPassthrough.currentChain = "";
        trackPropertyChainRefPassthrough.inPropertyChain = false;
        trackPropertyChainRefPassthrough.propertyChainEnded = false;
    }

    // Init handlers
    const initHandlersRefPassthrough: InitHandlersRefPassthrough = {
        inString: false,
        inTemplateLiteral: false,
        inRegex: false
    }

    const handleEscapeChars = createHandleEscapeChars();
    const stringSpecificHandlers = new StringSpecificHandlers(initHandlersRefPassthrough, config.keywordGenConfig.supportStrings, config.keywordGenConfig.supportTemplateLiterals)

    // Init counters
    /** A counter for the current depth into blocks */
    const blockDepthCounter = createBlockDepthCounter(
        blockDepthRefPassthrough);

    // Init trackers
    /** Track the property chain */
    const propertyChainTracker = createPropertyChainTracker(blockDepthRefPassthrough, trackPropertyChainRefPassthrough);
    /** Track the apply handler in the `Proxy` object */
    const proxyApplyTracker = createProxyApplyTracker();

    for (let i = 0; i < script.length; i++) {
        const char = script[i];

        yield {
            char,
            i
        };

        // Handle escape character
        if (handleEscapeChars(char))
            yield {
                char,
                i
            };
        // Handle string literals
        if (stringSpecificHandlers.stringLiteral(char))
            yield {
                char,
                i
            };
        // Handle template literals
        if (stringSpecificHandlers.templateLiteral(char))
            yield {
                char,
                i
            };
        // Handle RegEx
        if (stringSpecificHandlers.regEx(char))
            yield {
                char,
                i
            };

        // Track block depth
        blockDepthCounter(char);

        // Check for new line or semicolon to start a new statement
        if (processStatement(char, inNewStatement))
            yield {
                char,
                i
            };
        // We are no longer in a new statemnet
        if (inNewStatement) inNewStatement = false;

        /** Did this character end the property chain? */
        if (config.tracker.propertyChain) {
            const propertyChainData = propertyChainTracker(char);

            yield {
                i,
                inNewStatement,
                ...propertyChainData
            };
        } else if (config.tracker.proxyApply) {
            const applyData = proxyApplyTracker(char);
            if (applyData)
                yield {
                    i,
                    blockDepth: blockDepthRefPassthrough.blockDepth,
                    inNewStatement,
                    ...applyData,
                }
        }
        yield {
            char,
            i,
            blockDepth: blockDepthRefPassthrough.blockDepth,
            inNewStatement
        };
    }
}
