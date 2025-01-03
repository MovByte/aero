import typia from "typia";

import { type APIInterceptor, SupportEnum } from "$types/apiInterceptors";
import { OsPassthroughFeatures } from "$types/buildConfig";

import rewriteSrc from "$util/src";
import { proxyLocation } from "$shared/proxyLocation";

/** proxy origin, callback */
let launchQueuePendingCallbacks = new Map<string, Function>();

const bcPwaLaunched = new BroadcastChannel("$aero-os-passthrough-pwa-launched");

interface PwaLaunchedResp {
	proxyOrigin: string;
	// TODO: Find @types for the Launch Params API
	launchParams: any;
}

const validatePwaLaunchedResp = typia.createValidate<PwaLaunchedResp>();

export default [
	{
		init(ctx) {
			if (OsPassthroughFeatures.pwas in ctx.featuresConfig.osExtras) {
				bcPwaLaunched.onmessage = event => {
					const resp = event.data as PwaLaunchedResp;
					validatePwaLaunchedResp(resp);
					const callback = launchQueuePendingCallbacks.get(proxyOrigin);
					if (callback) {
						callback(resp.launchParams);
						launchQueuePendingCallbacks.delete(origin);
					}
				}
			}
		}
		createProxyHandler(ctx) {
			apply(target, that, args) {
				if (OsPassthroughFeatures.pwas in ctx.featuresConfig.osExtras) {
					const [callback] = args;
					launchQueuePendingCallbacks.set(proxyLocation().origin, callback);
				} else
					return Reflect.apply(target, that, args);
			}
		},
		for: "OS_EXTRA",
		globalProp: "LaunchQueue.prototype.setConsumer",
		exposedContexts: ExposedContextsEnum.window,
		supports: SupportEnum.nonstandard | SupportEnum.shippingChromium
	}
] as APIInterceptor[];