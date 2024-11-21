/**
 * @module
 * This module contains the loggers for *aero* and *AeroSandbox*
 * The types are located in `types/logger.d.ts` (in *AeroSandbox*)
*/

import type { LoggerOptions } from "../../types/loggers";

/** The bubbling style (for `aero` branding) in the logger */
const aeroBubbleStyle = genBubbleStyle("#0badfb");
/** The bubbling style (for `fatal` error branding) in the logger */
const fatalErrBubbleStyle = genBubbleStyle("#db3631");

/** 
 * A generic class meant to be extended that provides methods to create a logger in an aero-related project. There is little reason to use this directly unless you don't want aero to be the branding of the proxy.
 * Typically, you would want to extend `fatalErr` with a crash screen if you are extending the class for a Logger meant for a Sandbox if you are in debug mode.
 */
export default class GenericLogger {
	/** Enable debug mode for extra logging */
	debugMode: boolean;

	/**
	 * @param debugMode Log to the console when `this.debug(...)` is called
	 */
	constructor(debugMode: boolean) {
		this.debugMode = debugMode;
	}

	/**
	 * A method that wraps `console.log` with custom branding using bubbles
	 * @branding The name of the proxy and the text shown inside of the bubble
	 * @msgs The messages you want to log
	 */
	log(branding: string, msgs: string[] | string): void {
		if (!Array.isArray(msgs))
			msgs = [msgs];

		// Log all of the messages
		for (const msg in msgs)
			console.log(`%c${branding}%c ${msg}`, `${aeroBubbleStyle}`, "");
	}
	/**
	 * A method that wraps `console.warn` with custom branding using bubbles
	 * @branding The name of the proxy and the text shown inside of the bubble
	 * @msgs The messages you want to log
	 */
	warn(branding: string, msgs: string[] | string): void {
		if (!Array.isArray(msgs))
			msgs = [msgs];

		// Log all of the messages
		for (const msg in msgs)
			console.warn(`%c${branding}%c ${msg}`, `${aeroBubbleStyle}`, "");
	}
	/**
	 * A method that wraps `console.debug` with custom branding using bubbles only if debug mode is enabled.
	 * @branding The name of the proxy and the text shown inside of the bubble
	 * @msgs The messages you want to log
	 */
	debug(
		branding: string,
		msgs: string[] | string,
	): void {
		if (this.debugMode) {
			if (!Array.isArray(msgs))
				msgs = [msgs];

			// Log all of the messages
			for (const msg in msgs)
				console.debug(`%c${branding}%c ${msg}`, `${aeroBubbleStyle}`, "");
		}
	}
	/**
	 * A method that wraps `console.error` with custom branding using bubbles
	 * Unlike `this.fatalErr(...)`, this method does not show a fatal error bubble
	 * @branding The name of the proxy and the text shown inside of the bubble
	 * @msgs The messages you want to log
	 */
	error(
		branding: string,
		msgs: string[] | string,
	): void {
		if (!Array.isArray(msgs))
			msgs = [msgs];

		// Log all of the messages
		for (const msg in msgs)
			console.error(`%c${branding}%c ${msg}`, `${aeroBubbleStyle}`, "");
	}
	/**
	 * Log an error with the fatal bubble attached in addition to the branded bubble
	 * When extending `GenericLogger` for a sandboxing library it is highly recommended that you overwrite this behavior and make it show a crash screen with the messages instead
	 * @branding The name of the proxy and the text shown inside of the bubble
	 * @msgs The messages you want to log
	 */
	fatalErr(branding: string, msgs: string[] | string): void {
		if (!Array.isArray(msgs))
			msgs = [msgs];

		// Log all of the messages
		for (const msg in msgs)
			console.error(
				`%c${branding}%c %cfatal%c ${msg}`,
				`${aeroBubbleStyle}`,
				"",
				`${fatalErrBubbleStyle}`,
				""
			);
	}
}

/**
 * The Logger meant to be used in aero's SW
 */
export class AeroLogger extends GenericLogger {
	options: LoggerOptions;

	/**
	  * @param debugMode Log to the console when `this.debug(...)` is called
	  * @param options The options to configure the logger's behavior
	  */
	constructor(debugMode: boolean, options?: LoggerOptions) {
		super(debugMode);
		if (options) this.options = options;
	}

	/**
	 * A method that wraps `console.log` with aero branding using bubbles
	 * @param msgs The messages you want to log
	 */
	log(msgs: string[] | string): void {
		super.log("aero SW", msgs);
	}
	/**
	 * A method that wraps `console.warn` with aero branding using bubbles
	 * @param msgs The messages you want to log
	 */
	warn(msgs: string[] | string[] | string): void {
		super.warn("aero SW", msgs);
	}
	/**
	 * A method that wraps `console.debug` with aero branding using bubbles only if debug mode is enabled
	 * @param msgs The messages you want to log
	 */
	debug(msgs: string[] | string): void {
		super.warn("aero SW", msgs);
	}
	/**
	 * A method that wraps `console.error` with custom branding using bubbles.
	 * Unlike `this.fatalErr(...)`, this method does not show a fatal error bubble nor does it replace the site on the current client window with a crash screen.
	 * @branding The name of the proxy and the text shown inside of the bubble
	 * @msgs The messages you want to log
	 */
	error(msgs: string[] | string): void {
		super.error("aero SW", msgs);
	}
	fatalErr(msgs: string[] | string): /* Response */ Error {
		super.fatalErr("aero SW", msgs);
		return new Error(`Caught Fatal Error: ${msgs}`);
		/*
		TODO: Only show the crash string when the proxy is in DEBUG mode
		TODO: Unify the crash screen on the SW handler with extras and this one
		return new Response(
			/*
			// TODO: Fix
			this.options && "htmlTemplatingCallback" in this.options
				? `Fatal error:	 ${msgs}`
				: this.options.htmlTemplatingCallback(msgs),
				*\/
			msg,
			{
				status: 500,
				headers: {
					"content-type": "text/html"
				}
			}
		);
		*/
	}
}

/**
 * The logger meant to be used in *AeroSandbox*
 */
export class AeroSandboxLogger extends GenericLogger {
	options: LoggerOptions;

	constructor(debugMode: boolean; options: LoggerOptions) {
		super(debugMode);
		this.options = options;
	}

	log(msgs: string[] | string): void {
		super.log("aero sandbox", msgs);
	}
	warn(msgs: string[] | string): void {
		super.warn("aero sandbox", msgs);
	}
	error(msgs: string[] | string): void {
		super.error("aero sandbox", msgs);
	}
	fatalErr(msgs: string[] | string): void {
		// TODO: INSTEAD MAKE THIS A CRASH SCREEN IF THE DEBUG FLAG IS ENABLED
		super.fatalErr("aero sandbox", msgs);

		if (this.options.htmlTemplatingCallback !== undefined)
			this.options.htmlTemplatingCallback(msgs);
	}
}

/**
 * This function generates the CSS for the log bubbles in the loggers
 * @param color The color of the bubble
 * TODO: Write JSDoc examples for this
 */
export function genBubbleStyle(color: string): string {
	return /* css */`
color: white;
background-color: ${color};
padding: 3px 6px 3px 6px;
border-radius: 3px;
font: bold .8rem "Fira San", sans-serif;
	`;
}
