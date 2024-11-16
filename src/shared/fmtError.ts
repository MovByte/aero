/**
 * @module
 * This module is for formatting errors in a consistent way.
 * There is one of these for aero and one for AeroSandbox both in their `...shared/` folders
 * This is because they may have different default feature flags.
 */

import type { Err } from "neverthrow";
import { err as errr } from "neverthrow";

import createDefaultFeatureFlags from "../../createDefaultFeatureFlags";

// Remember this file isn't built into a bundle because it is a test file, so this must be done
const defaultFeatureFlags = createDefaultFeatureFlags({ debugMode: false });

/**
 * Fo
 * @param explanation The concise explanation of the `originalErr`
 * @param originalErr The original error that was caught
 * @returns The formatted error
 */
export default function fmtError(explanation: string, originalErr: string): Error {
	return new Error(`${explanation}${defaultFeatureFlags.errorLogAfterColon}${originalErr}`);
}

/**
 * 
 * @param explanation The concise explanation of the `originalErr`
 * @param originalErr The original error that was caught
 * @returns The formatted *Neverthrow* error
 */
export function fmtNeverthrowErr(explanation: string, originalErr: string): Err<void, Error> {
	return errr(fmtError(explanation, originalErr));
}
