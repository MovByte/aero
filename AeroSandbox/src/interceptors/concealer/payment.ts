import { type APIInterceptor, SupportEnum } from "$types/apiInterceptors.d.ts";

import { proxyGetString } from "$aero/src/shared/stringProxy";

import rewriteSrc from "$aero/src/shared/src";

// Only supported on Chromium
export default [
	{
		proxifiedObj: Proxy.revocable(PaymentRequest, {
			construct(target, prop, args) {
				const [methods] = args;

				args[0] = methods.map(method => rewriteSrc(method));

				return Reflect.construct(target, prop, args);
			}
		}),
		globalProp: "PaymentRequest",
		supports: SupportEnum.draft | SupportEnum.shippingChromium
	},
	{
		proxifiedObj: proxyGetString("MerchantValidationEvent", [
			"validationURL"
		]),
		globalProp: "MerchantValidationEvent",
		supports:
			SupportEnum.deprecated |
			SupportEnum.draft |
			SupportEnum.shippingChromium
	}
] as APIInterceptor[];
