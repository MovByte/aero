/**
 * @module
 * This module contains generic code used by both aero and AeroSandbox's build system
 */

import type { Result, AsyncResult } from "neverthrow";
import { ok, err as errr, okAsync, errAsync as errrAsync } from "neverthrow";

import InitDist from "../scripts/InitDist";
import genWebIDL from "../scripts/initApiTypes";
import initApis from "../scripts/initApis";

import type { FeatureFlags } from "./featureFlags.ts";

import importSync from "import-sync";

interface Dirs {
	dist: string;
	proper: string;
}
interface MiscRequiredArgs {
	verboseMode: boolean;
	// TODO: Import this type instead
	properDirType: "debug" | "prop";
}

/**
 * This method runs all of the scripts in the scripts directory for AeroSandbox
 */
export async function initAll(
	requiredDirs: Dirs,
	miscRequiredArgs: MiscRequiredArgs
): AsyncResult<void, Error> {
	const { dist: distDir, proper: properDir } = requiredDirs;
	const { verboseMode, properDirType } = miscRequiredArgs;

	const initDist = new InitDist(
		{
			dist: distDir,
			proper: properDir
		},
		properDirType,
		verboseMode
	);

	const initDistRes = await initDist.init()
	if (initDistRes.isErr())
		return errrAsync(new Error(`Failed to initialize the dist folder: ${initDistRes.error}`));
	const genWebIDLRes = genWebIDL(miscRequiredArgs.verboseMode);
	if (genWebIDLRes.isErr())
		return errrAsync(new Error(`Failed to generate WebIDL: ${genWebIDLRes.error}`));
	const initApisRes = initApis();
	if (initApisRes.isErr())
		return errrAsync(new Error(`Failed to initialize the API Bitwise Enum: ${initApisRes.error}`));

	return okAsync(undefined);
}

export function importFeatureFlagOverrides(): Result<
	Partial<FeatureFlags>,
	Error
> {
	try {
		const featureFlagOverrides = importSync(
			"./createFeatureFlags.ts"
		).default;
		return ok(featureFlagOverrides);
	} catch (err) {
		return errr(err);
	}
}

/**
 * This class is a helper for handling Neverthrow errors
 * @example
 * import { ErrUnwrapper } from "...";
 * 
 * const debugMode = process.env.DEBUG;
 * ...
 * const errUnwrapper = new ErrUnwrapper(debugMode);
 */
export class ErrUnwrapper {
	/**
	 * This will handle a Neverthrow `Result` and throw an error how it should be thrown accordingly
	 * @param res The result to handle
	 * @param msgDesc The description proceeding the actual returned error
	 * @param debugMode Should the error be thrown or logged?
	 * @param msgPreview The indicator proceeding the description
	 * @example
	 * errUnwrapper(func(), "Unable to do ...(something)");
	 */
	// biome-ignore lint/suspicious/noExplicitAny: this is intentionally generic
	// deno-lint-ignore no-explicit-any
	unwrap(
		res: Result<any | void, Error>,
		msgDesc: string,
		debugMode = true,
		msgPreview = "⚠️ "
	): void {
		if (res.isErr()) {
			const err = res.error;
			if (!debugMode) {
				console.warn(`${msgPreview}${msgDesc}${err.message}`);
			} else {
				console.warn(`${msgPreview}`);
				throw err;
			}
		}
	}
}
