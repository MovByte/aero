import {
	type APIInterceptor,
	ExposedContextsEnum
} from "$types/apiInterceptors.d.ts";

import rewriteSrc from "$aero/src/shared/src";

import { proxyLocation, upToProxyOrigin } from "$aero/src/shared/proxyLocation";

const historyState = {
	apply(target: any, that: ProxyHandler<object>, args: any[]) {
		let url = "";
		if (args.length > 2 && typeof args[2] === "string") {
			url = args[2];
		}

		try {
			if (args.length > 2) {
				args[2] = rewriteSrc(url, proxyLocation().href);
			}
			if (args.length > 3) {
				args[3] = rewriteSrc(url, proxyLocation().href);
			}
		} catch (error) {
			$aero.error(
				"An error occurred while intercepting the source in the History API interceptor: ",
				error
			);
		}

		return Reflect.apply(target, that, args);
	}
};

export default [
	{
		proxifiedObj: Proxy.revocable(history.pushState, historyState),
		globalProp: "history.pushState",
		exposedContexts: ExposedContextsEnum.window
	},
	{
		proxifiedObj: Proxy.revocable(history.replaceState, historyState),
		globalProp: "history.replaceState",
		exposedContexts: ExposedContextsEnum.window
	}
] as APIInterceptor[];
