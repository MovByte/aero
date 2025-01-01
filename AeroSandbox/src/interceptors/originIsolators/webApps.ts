import rewriteSrc from "$util/src";
import { proxyLocation } from "$shared/proxyLocation";

import { APIInterceptor } from "$types/apiInterceptors";

export default {
	createProxyHandler: ctx => ({
		async apply(target, that, args) {
			const relatedApps = await Reflect.apply(target, that, args);
			// @ts-ignore
			for (const relatedApp of relatedApps) {
				if (relatedApp.platform === "webapp")
					relatedApp.url = rewriteSrc(relatedApp.url, proxyLocation().href);
			}
		}
		// TODO: Import the @types for this
		// @ts-ignore
	} as ProxyHandler<Navigator["getInstalledRelatedApps"]>),
	escapeFixes: {
		what: "VALUE_PROXIFIED_OBJ",
		propsThatEscape: {
			"url": [
				{
					what: "URL_STRING",
					is: URL_IS_ESCAPE.FULL_URL
				}
			]
		}
	}
	originIsolator: true,
	globalProp: "navigator.prototype.getInstalledRelatedApps"
} as APIInterceptor;