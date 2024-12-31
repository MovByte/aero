import { type APIInterceptor, ExposedContextsEnum } from "$types/apiInterceptors";
import { URL_IS } from "$types/apiInterceptors";

import { proxyLocation, upToProxyOrigin } from "$shared/proxyLocation";
import { afterPrefix } from "$util/getProxyURL";
import rewriteSrc from "$shared/src";

/*
export default {
	skip: true,
	globalProp: "navigator.serviceWorker"
} as APIInterceptor;
*/

export default [
	{
		proxyHandler: {
			apply(target, that, args) {
				const [path, opts] = args;
				// Rewrite this here so that the SW can handle it and nest the scripts accordingly
				args[0] = `${rewriteSrc(path, proxyLocation().href)}?mod=${opts.type === "module"
					}`;
				$aero.logger.log(
					`Registering a nested service worker\n${path} ➜ ${args[0]}`
				);

				return Reflect.apply(target, that, args);
			},
		},
		globalProp: "navigator.serviceWorker.register",
		exposedContexts: ExposedContextsEnum.window
	},
	{
		proxifyGetter(ctx) {
			// Undo this revealer (conceal and return the fake URL expected by the site)
			Object.defineProperty(ctx.this, "scriptURL", {
				get() {
					return afterPrefix(ctx.this.scriptURL);
				},
			});
			ctx.this.postMessage = new Proxy(ctx.this.postMessage, {
				apply(target, that, args) {
					args[0] = {
						from: ctx.this.scriptURL,
						realMsg: args[0]
					};
					return Reflect.apply(target, that, args);
				},
			});
		},
		globalProp: "ServiceWorkerContainer.prototype.controller",
		exposedContexts: ExposedContextsEnum.window
	},
	{
		proxifyGetter(ctx) {
			return new Promise((resolve, reject) => {
				ctx.this.then(reg => {
					resolve(rewriteReg(reg));
				}).catch(reject);
			});
		},
		escapeFixes: [
			{
				targeting: "VALUE_PROXIFIED_OBJ",
				propsThatEscape: {
					"index.add": [{
						targeting: "API_PARAM",
						targetingParam: 1,
						apiMethod: "add",
						type: {
							what: "URL_STRING",
							is: URL_IS.ANY_URL
						},
					}]
				}
			}
		],
		globalProp: "ServiceWorkerContainer.prototype.ready",
		exposedContexts: ExposedContextsEnum.window
	}, {
		proxyHandler: {
			apply: async target => rewriteReg(await target())
		},
		globalProp: "navigator.serviceWorker.getRegistration",
		exposedContexts: ExposedContextsEnum.window
	}, {
		proxyHandler: {
			apply: async target => (await target()).map(reg => rewriteReg(reg))
		},
		globalProp: "navigator.serviceWorker.getRegistrations",
		exposedContexts: ExposedContextsEnum.window
	}
] as APIInterceptor[];

const rewriteReg = reg => {
	// Don't let the site see the aero sw (unconceal the URL)
	reg.active.scriptURL = afterPrefix(reg.active)
	if (reg.index) {
		reg.index = new Proxy(reg.index, {
			get(target, prop) {
				if (prop === "add") {
					return new Proxy(target.add, {
						apply(target, that, args) {
							const [url] = args;
							args[0] = rewriteSrc(url);
							return Reflect.apply(target, that, args);
						},
					});
				}
				return target[prop];
			},
		})
	}
	return;
}
