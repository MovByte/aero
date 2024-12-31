import {
	type APIInterceptor,
	ExposedContextsEnum,
	URL_IS_ESCAPE
} from "$types/apiInterceptors.d.ts";

// Utility
import { proxyLocation } from "$shared/proxyLocation";
import rewriteSrc from "$intUtil/src";

/** 
 * Shared proxy handlers for the methods on the history API that modify the state (`history.pushState` and `history.replaceState`)
 */
const historySharedProxyHandlers = {
	apply(target: any, that: ProxyHandler<object>, args: any[]) {
		let url = "";
		if (args.length > 2 && typeof args[2] === "string")
			url = args[2];

		try {
			if (args.length > 2) {
				args[2] = rewriteSrc(url, proxyLocation().href);
			}
			if (args.length > 3) {
				args[3] = rewriteSrc(url, proxyLocation().href);
			}
		} catch (err) {
			$aero.logger.fatalErr(
				`An error occurred while intercepting the source in the History API interceptor${ERR_LOG_AFTER_COLON}`,
				err
			);
		}

		return Reflect.apply(target, that, args);
	}
} as ProxyHandler<History>;
/**
 * The fix types for the history API metthods that modify the state (`history.pushState` and `history.replaceState`)
 */
const historySharedEscapeFixTypes = [
	{
		targeting: "param",
		targetingParam: 2,
		type: {
			what: "URL_STRING",
			is: URL_IS_ESCAPE.FULL_URL
		}
	}
	{
		targeting: "param",
		targetingParam: 3,
		type: {
			what: "URL_STRING",
			is: URL_IS_ESCAPE.FULL_URL
		}
	}
]
export default [
	{
		proxyHandler: historySharedProxyHandlers,
		globalProp: "history.pushState",
		escapeFixes: historySharedEscapeFixTypes,
		exposedContexts: ExposedContextsEnum.window
	},
	{
		proxyHandler: historySharedProxyHandlers,
		globalProp: "history.replaceState",
		escapeFixes: historySharedEscapeFixTypes,
		exposedContexts: ExposedContextsEnum.window
	}
] as APIInterceptor[];
