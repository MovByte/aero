import {
	type APIInterceptor,
	ExposedContextsEnum
} from "$types/apiInterceptors.d.ts";

// Utility
import { proxyLocation } from "$shared/proxyLocation";
import rewriteSrc from "$intUtil/src";

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
};
// TODO: MAKE A TYPE FOR THIS AS AND DO THIS FOR ALL ESCAPE FIXERS
const historySharedEscapeFixTypes = [
	{
		targeting: "param",
		targetingParam: 3,
		escapeType: {
			what: "url",
			escapeType: "full"
		}
	}
]
export default [
	{
		proxyHandlers: historySharedProxyHandlers,
		globalProp: "history.pushState",
		escapeFixes: historySharedEscapeFixTypes,
		exposedContexts: ExposedContextsEnum.window
	},
	{
		proxyHandlers: historySharedProxyHandlers,
		globalProp: "history.replaceState",
		escapeFixes: historySharedEscapeFixTypes,
		exposedContexts: ExposedContextsEnum.window
	}
] as APIInterceptor[];
