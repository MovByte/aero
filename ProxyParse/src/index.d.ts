export type processKeywordHandlerType = (i: number, char: string, ctx: Partial<processKeywordHandlerCtx>) => void
export interface processKeywordHandlerCtx {
    blockDepth: boolean;
    enteredNewStatement: boolean;
    currentChain: string;
    /** Flag for tracking if the character is in a property chain */
    inPropertyChain: boolean;
    /** Flag for tracking if the property chain has ended */
    propertyChainEnded: boolean;
    /** Is it tracking the handler object? */
    inProxyTrackingHandler: boolean;
    inProxy: boolean;
    inApply: boolean;
    inApplyBody: boolean;
    /** Is it just now entering the apply body? */
    enteringApplyBody: boolean;
    exitingProxyHandler: boolean;
}

// Ref passthrough
export interface EnteredNewStatementRefPassthrough {
    enteredNewStatement: boolean;
}
export interface BlockDepthRefPassthrough {
    /**
     * Block depth counter
     * This counter is primarly used for AeroGel
    **/
    blockDepth: number;
}
export interface TrackPropertyChainRefPassthrough {
    /**
     * The current accumulated characters in property chain tracker.
     * Track property access sequences.
     */
    currentChain: string;
    /** Flag for tracking if the character is in a property chain */
    inPropertyChain: boolean;
    /** Flag for tracking if the property chain has ended */
    propertyChainEnded: boolean;
}
export interface InitHandlersRefPassthrough {
    /**
     * Indicates if the current character is within a string
     * This is shared with the other init handlers.
     */
    inString: inStringType;
    /**
    * Indicates if the current character is within a template literal.
    * This is shared with the other init handlers.
    */
    inTemplateLiteral: false;
    /**
    * Indicates if the current character is within a regular expression.
    * This is shared with the other init handlers.
    */
    inRegex: false;
}

// Iteratorw
export type keywordIterator = Iterator<{
    char: string;
    i: number;
    inNewStatement?: boolean;
    blockDepth?: number;
    inPropertyChain?: boolean;
    propertyChainEnded?: boolean;
    currentChain?: string;
    inProxyTrackingHandler?: boolean; // Is it tracking the handler object?
    inProxy?: boolean;
    inApply?: boolean;
    inApplyBody?: boolean;
    exitingApplyBody?: true; // Is it just now exiting the apply body?
}>;

// Handlers
export type handleChar = (char: string) => boolean;

// Trackers
export type proxyApplyTracker = (char: string) => object | void;
/**
 * Check if the given chain contains computed access possibly to the `window` or `location` object
 * @param char The character to check and see if it could elongate the chain
 * @returns Whether the character denotes computed access
 */
type createCheckIfCharDenotesComputedAccess = (char: string) => boolean;

// Counters
/// Depth counters
export type blockDepthCounter = (char: string) => void;

export type inStringType = false | "single" | "double";
export type inProxyType = false | "class" | "revocable";

// Keywords
export type varAssignmentKeywords = "var" | "let" | "const";
export interface ReturnTypeForVarAssignmentKeywordReplacement {
    /** What the new value of `res` should be after we do these replacements */
    newRes: string,
    /** If you should `continue` to pass to the next iteration of the loop */
    shouldContinue: boolean
    /** This is only done if there is no iterator provided (in the case that the handler is being used) */
    skipChars?: number
}

export type KeywordGenConfig = {
    /** Support for ignoring strings, as you should properly */
    supportStrings: boolean;
    supportTemplateLiterals: boolean;
    supportRegex: boolean;
}
export type TrackerConfig = {
    /** Track the depth of the blocks s*/
    blockDepth: boolean;
    /** This is made for DSPC or Jails systems, but you may use it however you like */
    propertyChain: boolean;
    /** Track the apply handler in the `Proxy` object*/
    proxyApply: boolean;
}
