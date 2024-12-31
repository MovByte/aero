import {
	type APIInterceptor,
	ExposedContextsEnum,
	URL_IS_ESCAPE
} from "$types/apiInterceptors.d.ts";

import rewriteSrc from "$util/src";

export default {
	proxyHandler: {
		apply(target, that, args) {
			const [url] = args;
			// Turn the real URL into a proxy URL (routed under aero)
			args[0] = rewriteSrc(url);
			return Reflect.apply(target, that, args);
		}
	} as ProxyHandler<Window["open"]>,
	escapeFixes: [
		{
			targeting: "param",
			targetingParam: 1,
			type: {
				what: "URL_STRING",
				type: URL_IS_ESCAPE.FULL_URL,
			},
		},
	],
	globalProp: "open",
	exposedContexts: ExposedContextsEnum.window
} as APIInterceptor;
