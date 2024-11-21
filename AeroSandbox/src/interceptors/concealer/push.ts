import {
	type APIInterceptor,
	ExposedContextsEnum
} from "$types/apiInterceptors.d.ts";
import { proxyGetString } from "$aero/src/shared/stringProxy";

export default {
	proxifiedObj: proxyGetString("PushSubscription", ["endpoint"]),
	globalProp: "PushSubscription",
	exposedContexts: ExposedContextsEnum.window
} as APIInterceptor;
