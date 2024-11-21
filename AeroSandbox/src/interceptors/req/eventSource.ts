import {
	type APIInterceptor,
	SpecialInterceptionFeaturesEnum
} from "$types/apiInterceptors.d.ts";

import { proxyConstructString } from "$aero/src/shared/stringProxy";

export default {
	proxifiedObj: ctx => {
		if (
			"requestUrlProxifier" in ctx.specialInterceptionFeatures &&
			ctx.specialInterceptionFeatures.requestUrlProxifier === true
		)
			return proxyConstructString("EventSource", [1]);
		return;
	},
	globalProp: "EventSource",
	specialInterceptionFeatures:
		SpecialInterceptionFeaturesEnum.requestUrlProxifier
} as APIInterceptor;
