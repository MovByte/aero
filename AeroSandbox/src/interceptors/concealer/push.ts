import {
	type APIInterceptor,
	ExposedContextsEnum
} from "$types/apiInterceptors.d.ts";
import { proxyGetString } from "$util/stringProx";

export default {
	proxifiedObj: proxyGetString("PushSubscription", ["endpoint"]),
	globalProp: "PushSubscription",
	exposedContexts: ExposedContextsEnum.window
} as APIInterceptor;
