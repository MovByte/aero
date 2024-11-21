import type { AeroLogger, AeroSandboxLogger } from "$utilUtil/Loggers";

/** A type union of all of the `Logger` classes. You would tend to use this in `$utilUtil` files. */
export type eitherLogger = AeroLogger | AeroSandboxLogger;

/** A callback to get the HTML shown on the crash screen that lets you use the Error message as templating */
type htmlTemplatingCallbackType = (errMsg: string) => string;
/** The options to configure each `Logger` class (what is passed into the constructors) */
interface LoggerOptions {
	htmlTemplatingCallback?: htmlTemplatingCallbackType;
}
