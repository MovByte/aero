import { type APIInterceptor, SupportEnum } from "$types/apiInterceptors.d.ts";

import { afterPrefix } from "$util/getProxyURL";

export default {
	proxifiedHandler: {
		apply(_target, _that, args) {
			const [callback] = args;

			// Conceal the target URL from the launch params
			return (launchParams: any) => {
				launchParams.targetUrl = afterPrefix(launchParams.targetUrl);
				callback(launchParams);
			};
		}
	},
	globalProp: "launchQueue.setConsumer",
	conceals: ["LaunchParams.targetURL"],
	supports: SupportEnum.draft | SupportEnum.shippingChromium
} as APIInterceptor;
