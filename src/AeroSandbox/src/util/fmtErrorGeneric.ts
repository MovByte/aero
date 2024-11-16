/**
 * @module
 * This module can create methods that format error in a consistent way.
 * It is intended to be used in the `fmtError.ts` files for aero and AeroSandbox and is simplify an abstraction for them
 */

import { Err, err as errr, errAsync as errrAsync } from "neverthrow";

/**
 * I could've used a class for this, but I felt it would be overkill for its intended use case.
 * @param featureFlags 
 * @returns The methods for formatting errors
 * 
 * @example
 * export const { fmtError, fmtNeverthrowErr } = createErrorFmters(ERROR_LOG_AFTER_COLON);
 */
const createErrorFmters = (errorLogAfterColon: string) => ({
	/**
	 * Formats an error in a consistent way
	 * @param explanation The concise explanation of the `originalErr`
	 * @param originalErr The original error that was caught
	 * @returns The formatted error
	 */
	fmtError: (explanation: string, originalErr: string): Error => new Error(`${explanation}${errorLogAfterColon}${originalErr}`),
	/**
	 * Formats a *Neverthrow* error in a consistent way
	 * @param explanation The concise explanation of the `originalErr`
	 * @param originalErr The original error that was caught
	 * @returns The formatted *Neverthrow* error
	 */
	// @ts-ignore
	fmtNeverthrowErr: (explanation: string, originalErr: string, async = false): Err<void, Error> => (async ? errrAsync : errr)(this.fmtError(explanation, originalErr))
});
export default createErrorFmters;