/**
 * @module 
 * A rudimentary log function that only logs if verbose mode is enabled
 * This is different from the other `Logger.ts` in that this is meant to be used in the build process only
 * @example
 * const verboseMode = !("VERBOSE" in process.env);
 * const logger = new Logger(verboseMode);
 * logger.log("Hello, world!");
 */

export class Logger {
	/**
	 * @param verboseMode Should the log method do anything?
	 */
	verboseMode: boolean;
	/**
	 * @param verboseMode Whether verbose mode is enabled.
	 */
	constructor(verboseMode: boolean) {
		this.verboseMode = verboseMode;
	}
	/**
	 * This method wraps console.log, but doesn't log if verbose mode is disabled
	 * @param msg The message to log
	 */
	// biome-ignore lint/suspicious/noExplicitAny: this is intentionally generic
	log(msg: any) {
		if (this.verboseMode) console.log(msg);
	}
}