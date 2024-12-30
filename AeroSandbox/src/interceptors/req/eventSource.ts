import {
	type APIInterceptor,
	SpecialInterceptionFeaturesEnum
} from "$types/apiInterceptors.d.ts";

import { proxyConstructString } from "$util/stringProx";

export default {
	skip: true,
	globalProp: "EventSource"
	/*
	You know this wouldn't work
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
	*/
} as APIInterceptor;
