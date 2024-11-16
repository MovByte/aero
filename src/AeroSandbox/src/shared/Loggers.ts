/**
 * @module
 * This module contains the loggers for aero and AeroSandbox
*/


type htmlTemplatingCallbackType = (errStr: string) => string;

const aeroBubbleStyle = genBubbleStyle("#0badfb");
const fatalErrBubbleStyle = genBubbleStyle("#db3631");

// TODO: Support optionalSecondaryBubble after the branding and in the color green :)
export class GenericLogger {
	log(branding: string, msgs: string[] | string, optionalSeconaryBubble?: string): void {
		if (!Array.isArray(msgs))
			msgs = [msgs];

		for (const msg in msgs)
			console.log(`%c${branding}%c ${msg}`, `${aeroBubbleStyle}`, "");
	}
	warn(branding: string, msgs: string[] | string, optionalSeconaryBubble?: string): void {
		if (!Array.isArray(msgs))
			msgs = [msgs];

		for (const msg in msgs)
			console.warn(`%c${branding}%c ${msg}`, `${aeroBubbleStyle}`, "");
	}
	debug(
		branding: string,
		msgs: string[] | string,
		optionalSecondaryBubble?: string
	): void {
		if (DEBUG) {
			if (!Array.isArray(msgs))
				msgs = [msgs];

			for (const msg in msgs)
				console.debug(`%c${branding}%c ${msg}`, `${aeroBubbleStyle}`, "");
		}
	}
	error(
		branding: string,
		msgs: string[] | string,
		optionalSeconaryBubble?: string
	): void {
		if (!Array.isArray(msgs))
			msgs = [msgs];

		for (const msg in msgs)
			console.error(`%c${branding}%c ${msg}`, `${aeroBubbleStyle}`, "");
	}
	fatalErr(branding: string, msgs: string[] | string): void {
		if (!Array.isArray(msgs))
			msgs = [msgs];

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

interface LoggerOptions {
	htmlTemplatingCallback?: htmlTemplatingCallbackType;
}

export default class AeroLogger extends GenericLogger {
	options: LoggerOptions;
	debugMode: boolean;

	// TODO: I switched around the args replace every construct of Aerologger
	constructor(debugMode: boolean, options?: LoggerOptions) {
		this.debugMode = debugMode;
		super();
		if (options) this.options = options;
	}

	log(msgs: string[] | string): void {
		super.log("aero SW", msgs);
	}
	warn(msgs: string[] | string[] | string): void {
		super.warn("aero SW", msgs);
	}
	debug(msgs: string[] | string): void {
		super.warn("aero SW", msgs);
	}
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

// TODO: Support the seconary bubbling
export class AeroSandboxLogger extends GenericLogger {
	options: LoggerOptions;

	constructor(options: LoggerOptions) {
		super();
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
export default function genBubbleStyle(color: string): string {
	return /* css */`
color: white;
background-color: ${color};
padding: 3px 6px 3px 6px;
border-radius: 3px;
font: bold .8rem "Fira San", sans-serif;
	`;
}
