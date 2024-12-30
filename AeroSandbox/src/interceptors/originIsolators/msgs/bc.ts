import { type APIInterceptor, SupportEnum } from "$types/apiInterceptors";

/**
 * The API Interceptor for escaping the messages done internally by aero through the BroadcastChannel API (escape)
 */
export default {
	proxyHandler: {
		construct(target, args) {
			const [chanName] = args;
			const proxifiedChanName = chanName.startsWith("$aero-") ? `$aero-${chanName}` : chanName;
			return Reflect.construct(target, [proxifiedChanName, ...args.slice(1)]);
		}
	},
	globalName: "BroadcastChannel",
	supports: SupportEnum.widelyAvailable
} as APIInterceptor;