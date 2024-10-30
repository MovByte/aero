// TODO: Import the parser configs

/**
 * @module
 */

// @ts-ignore
export default function* processKeyword(script: string, config: AeroGelParserConfig | AeroJetParserConfig) {
    /**
     * Stores the final result after processing.
     */
    let res = "";
    /**
     * Indicates if the current character is within a string.
     */
    let inString = false;
    /**
     * Indicates if the current character is within a template literal.
     */
    let inTemplateLiteral = false;
    /**
     * Indicates if the current character is within a regular expression.
     */
    let inRegex = false;
    /**
     * Indicates if the next character should be escaped.
     * Used when encountering an escape character (e.g., backslash) in strings or regex.
     */
    let escapeNext = false;
    let inNewStatement = true;
    // Block depth counter
    let blockDepth = 0;

    for (let i = 0; i < script.length; i++) {
        const char = script[i];

        // Handle escape character
        if (escapeNext) {
            escapeNext = false;
            yield {
                char,
                i
            };
        }
        if (char === '\\') {
            escapeNext = true;
            yield {
                char,
                i
            };
        }

        // Handle string literals
        if ((char === '"' || char === "'") && config.respectStrings && !inTemplateLiteral && !inRegex) {
            inString = !inString;
            yield {
                char,
                i
            };
        }

        // Handle template literals
        if (char === '`' && config.respectTemplateLiterals && !inString && !inRegex) {
            // Toggle (outside now)
            inTemplateLiteral = !inTemplateLiteral;
            yield {
                char,
                i
            };
        }

        // Handle RegEx
        if (char === '/' && config.respectRegex && !inString && !inTemplateLiteral) {
            // Toggle (outside now)
            inRegex = !inRegex;
            yield {
                char,
                i
            };
        }

        // Track block depth and new statement
        if (char === '{') blockDepth++;
        if (char === '}') blockDepth--;
        // Check for new line or semicolon to start a new statement
        if (char === '\n' || char === ';') {
            // Reset for the start of a new statement
            inNewStatement = true;
            yield {
                char,
                i
            };
        }

        // We are no longer in a new statemnet
        if (inNewStatement) inNewStatement = false;

        yield {
            char,
            i,
            blockDepth,
            inNewStatement
        };
    }
}
