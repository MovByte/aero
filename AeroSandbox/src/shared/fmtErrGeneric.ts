/**
 * @module
 * This module can create methods that format error in a consistent way.
 * It is intended to be used in the `fmtErr.ts` files for aero and AeroSandbox and is simplify an abstraction for them
 */

import type { Err } from "neverthrow";
import { err as nErr, errAsync as nErrAsync } from "neverthrow";
import createGenericTroubleshootingStrs from "./createGenericTroubleshootingStrs.ts";

/**
 * I could've used a class for this, but I felt it would be overkill for its intended use case
 * @param errLogAfterColon A feature log to help with the formatting of the unpacked *Neverthrow* errors
 * @returns The methods for formatting *Neverthrow* errors
 * 
 * @example
 * export const { fmtErr, fmtNeverthrowErr } = createErrorFmters(ERR_LOG_AFTER_COLON);
 */
const createErrorFmters = (errLogAfterColon: string) => ({
	/**
	 * Formats an error in a consistent way
	 * @param explanation The concise explanation of the `originalErr`
	 * @param originalErr The original error that was caught
	 * @returns The formatted error
	 */
	fmtErr: (explanation: string, originalErrs: string | readonlystring[], customFaultTag?: string): Error => new Error(this.fmtRawErr(explanation, originalErrs, customFaultTag)),
	/**
	 * Formats a *Neverthrow* error in a consistent way
	 * This method warps `fmtErr` in a *Neverthrow* error
	 * @param explanation The concise explanation of the `originalErr`
	 * @param originalErr The original error that was caught
	 * @returns The formatted *Neverthrow* error
	 */
	// @ts-ignore I want to do this method switching, and it doesn't matter what the first template type is in `Err` from *Neverthrow*, because this method is meant to be generic
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	fmtNeverthrowErr: (explanation: string, originalErrs: Error | readonly Error[], async = false, customFaultTag?: string): Err<any, Error> => (async ? nErrAsync : nErr)(this.fmt							RawErr(explanation, originalErrs, customFaultTag)),
	fmtRawErr: (explanation: string, originalErrs: Error | readonly Error[], customFaultTag?: string): string => {
		if (!Array.isArray(originalErrs))
			originalErrs = [originalErrs];
		return (`${customFaultTag || createGenericTroubleshootingStrs(errLogAfterColon).aeroErrTag}${explanation}${originalErrs.map(err => err.stack.split("\n").join("\n\t")).join(errLogAfterColon)}`);
	},
});
export default createErrorFmters;