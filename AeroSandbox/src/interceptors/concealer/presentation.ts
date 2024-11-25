import { type APIInterceptor, SupportEnum } from "$types/apiInterceptors.d.ts";

import { proxyGetString } from "$util/stringProx";

import rewriteSrc from "$util/src";

export default [
	{
		proxifiedObj: Proxy.revocable(PresentationRequest, {
			construct(that, args) {
				// Could either be a string or an array
				let [urls] = args;

				if (Array.isArray(urls))
					urls = urls.map(url => rewriteSrc(url));
				else urls = rewriteSrc(urls);

				args[0] = urls;

				return Reflect.construct(that, args);
			}
		}),
		globalProp: "PresentationRequest",
		supports: SupportEnum.draft | SupportEnum.shippingChromium
	},
	{
		proxifiedObj: proxyGetString("PresentationConnection", ["url"]),
		globalProp: "PresentationConnection",
		supports: SupportEnum.draft | SupportEnum.shippingChromium
	}
] as APIInterceptor[];
