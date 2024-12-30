import { type APIInterceptor, SupportEnum } from "$types/apiInterceptors.d.ts";

import { proxyGetString } from "$util/stringProxy";
import rewriteSrc from "$util/src";

export default [
	{
		proxifyGetter(ctx) {
			// ctx.this would be an instance of PresentationRequest
			ctx.this = new Proxy(ctx.this, {
				construct(that, args) {
					/** Could either be a string or an array */
					let [urls] = args;
					if (Array.isArray(urls))
						urls = urls.map(url => rewriteSrc(url));
					else urls = rewriteSrc(urls);
					args[0] = urls;
					return Reflect.construct(that, args);
				}
			})
		},
		globalProp: "navigator.presentation.receiver.defaultRequest",
		subAPIs: {
			"start": {
				globalProp: "PresentationRequest.start",
				supports: SupportEnum.draft | SupportEnum.shippingChromium
			}
		},
		supports: SupportEnum.draft | SupportEnum.shippingChromium
	},
	{
		proxyHandler: {
			async apply(target, that, args) {
				return rewriteConn(await Reflect.apply(target, that, args));
			}
		},
		globalProp: "PresentationRequest.prototype.start",
		supports: SupportEnum.draft | SupportEnum.shippingChromium
	},
	{
		proxifyGetter(ctx) {
			return new Promise((resolve, reject) => {
				ctx.this.then(conns => {
					resolve(conns.map(rewriteConn));
				}).catch(reject);
			});
		},
		globalProp: "navigator.presentation.receiver.connectionList",
		supports: SupportEnum.draft | SupportEnum.shippingChromium
	}
] as APIInterceptor[];

function rewriteConn(conn) {
	conn.url = new Proxy(conn.url, proxyGetString("PresentationConnection", ["url"]));
}