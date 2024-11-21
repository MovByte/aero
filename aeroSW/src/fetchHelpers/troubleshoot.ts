// Neverthrow for improved error handling
import type { Result } from "neverthrow"
import { err as nErr } from "neverthrow";
import { fmtNeverthrowErr } from "$shared/fmtErr";
import { createGenericTroubleshootingStrs } from "$shared/genericTroubleshootingStrs";

// For runtime type validation
import typia from "typia";

// For runtime type validation
import type BareMux from "@mercuryworkshop/bare-mux";
import type { AeroLogger } from "$shared/Loggers";
import type { Config } from "$aero/config";

const baremuxValidation = typia.validate<BareMux>(BareMux);
const loggerValidation = typia.validate<AeroLogger>(logger);
const configValidation = typia.validate<Config>(aeroConfig);

/** Shared strings used across aero for error messages **/
// TODO: Make something like this for AeroSandbox
export const troubleshootingStrs = {
	...createGenericTroubleshootingStrs(ERR_LOG_AFTER_COLON),
	/** A message for when the user fails to import a bundle properly or not at all */
	tryImportingItMsg: `. Try importing the bundle. Perhaps you ordered the bundles wrong (with importScripts)?
Ensure the bundles are in this order:
	1. BareMux
	2. aero loggers (logger.js)
	4. aero's default config (defaultConfig.js)
	3. aero's config (config.js)
	5. aero's SW bundle (aeroSW.js)`,
	/** Whose fault it is for the configs not validating */
	validationTarget: DEBUG ? "you (the proxy site developer)" : "the proxy site hoster"
}

/**
 * Checks for common proxy site dev problems when configuring their SW for aero and validate that everything is prepared properly for the rest of aero's SW handler
 */
export default function troubleshoot(): Result<void, Error> {
	// Sanity checks to ensure that everything has been initalized properly
	if (!("logger" in self))
		return nErr(new Error(`${troubleshootingStrs.devErrTag}The logger hasn't been initalized!${troubleshootingStrs.tryImportingItMsg}`));
	if (!("BareMux" in self))
		throw nErr(new Error(`${troubleshootingStrs.devErrTag}There is no bare client (likely BareMux) provided!${troubleshootingStrs.tryImportingItMsg}`));
	if (!("aeroConfig" in self)) {
		if ("defaultConfig" in self)
			return nErr(new Error(`${troubleshootingStrs.devErrTag}There is no default config provided! You need to create one other than the default`));
		return nErr(new Error(`${troubleshootingStrs.devErrTag}There is no config provided!${troubleshootingStrs.tryImportingItMsg}`));
	}
	/// Runtime type validations
	if (!baremuxValidation.success)
		return fmtNeverthrowErr(`${troubleshootingStrs.devErrTag}The BareMux bundle you provided is invalid! You may have imported a bare client that doesn't fully support the BareMux 2.0 specification. This could happen if you are using the classic bare client from TompHTTP and not the new one from Mercury Workshop or if you haven't updated the one from Mercury Workshop to 2.0+.", ...baremuxValidation.errors`);
	if (!loggerValidation.success)
		return fmtNeverthrowErr(`${troubleshootingStrs.devErrTag}The logger bundle ${troubleshootingStrs.validationTarget} provided is invalid!`, ...loggerValidation.errors);
	if (!configValidation.success)
		return fmtNeverthrowErr(`${troubleshootingStrs.devErrTag}The config ${troubleshootingStrs.validationTarget} provided is invalid!`, ...configValidation.errors);
}