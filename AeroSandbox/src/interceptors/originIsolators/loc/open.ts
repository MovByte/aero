import {
	type APIInterceptor,
	ExposedContextsEnum
} from "$types/apiInterceptors.d.ts";

import rewriteSrc from "$util/src";

export default {
	proxyHandlers: {
		apply(target, that, args) {
			const [url] = args;
			// Turn the real URL into a proxy URL (routed under aero)
			args[0] = rewriteSrc(url);
			return Reflect.apply(target, that, args);
		}
	},
	escapeFixes: [
		{
			targeting: "param",
			targetingParam: 1,
			escapeType: {
				what: "url",
				escapeType: "full",
			},
		},
	],
	globalProp: "open",
	exposedContexts: ExposedContextsEnum.window
} as APIInterceptor;
