import type { InitHandlersRefPassthrough, handleChar, inStringType } from "../index.js";

// Processors/Handlers
export function createHandleEscapeChars(): handleChar {
    /**
     * Indicates if the next character should be escaped.
     * Used when encountering an escape character (e.g., backslash) in strings or regex.
     */
    let escapeNext = false;

    return (char: string): boolean => {
        if (escapeNext) {
            escapeNext = false;
            return true;
        }
        if (char === '\\') {
            escapeNext = true;
            return true;
        }
        return false;
    }
}
export class StringSpecificHandlers {
    // Tracker vars
    refPassthrough: InitHandlersRefPassthrough;
    // Configs
    supportStrings: boolean;
    supportTemplateLiterals: boolean;
    supportRegEx: boolean;

    constructor(refPassthrough: InitHandlersRefPassthrough, supportStrings: boolean, supportTemplateLiterals: boolean) {
        this.refPassthrough = refPassthrough;
        // Tracker config vars
        this.supportStrings = supportStrings;
        this.supportTemplateLiterals = supportTemplateLiterals;
    }
    stringLiteral(char: string): boolean {
        // TODO: Differentiate between the two types of quotes
        const notInsideOtherTrackers = !this.refPassthrough.inTemplateLiteral && !this.refPassthrough.inRegex;
        if (this.supportStrings && notInsideOtherTrackers) {
            if (char === '"') {
                // Toggle (outside now)
                if (this.refPassthrough.inString === false)
                    this.refPassthrough.inString = "double";
                else if (this.refPassthrough.isString === "double")
                    this.refPassthrough.isString = false;
                return true;
            }
            if (char === "'") {
                // Toggle (outside now)
                if (this.refPassthrough.inString === false)
                    this.refPassthrough.inString = "single";
                else if (this.refPassthrough.isString === "single")
                    this.refPassthrough.isString = false;
                return true;
            }
        }
        return false;
    }
    templateLiteral(char: string): boolean {
        const notInsideOtherTrackers = !this.refPassthrough.inString && !this.refPassthrough.inRegex;
        if (char === '`' && this.supportTemplateLiterals && notInsideOtherTrackers) {
            // Toggle (outside now)
            this.refPassthrough.inTemplateLiteral = !this.refPassthrough.inTemplateLiteral;
            return true;
        }
        return false;
    }
    regEx(char: string): boolean {
        const notInsideOtherTrackers = !this.refPassthrough.inString && !this.refPassthrough.inTemplateLiteral;
        if (char === '/' && this.supportRegEx && notInsideOtherTrackers) {
            // Toggle (outside now)
            this.refPassthrough.inRegex = !this.refPassthrough.inRegex;
            return true;
        }
        return false;
    }
}

// Processors
/**
 * Process the new lines if they exist
 * @param char The character to process
 * @returns Whether the character is a start of a new statement and should be skipped
 */
export function processStatement(char: string, inNewStatementRefPassthrough: InNewStatementRefPassthrough): boolean {
    if (char === '\n' || char === ';') {
        // Reset for the start of a new statement
        inNewStatementRefPassthrough.inNewStatement = true;
        return true;
    }
    return false;
}
