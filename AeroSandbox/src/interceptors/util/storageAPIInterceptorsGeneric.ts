import { type APIInterceptor, SupportEnum } from "$types/apiInterceptors.d.ts";

import { storageNomenclatureHandlers } from "./storage";

export default function genStorageAPIInterceptors(key: string, sharedStorage = false): APIInterceptor[] {
	return storageAPIInterceptorsGeneric.map(apiInterceptor => {
		apiInterceptor.globalProp = key + apiInterceptor.globalProp;
		apiInterceptor.supports = sharedStorage ? SupportEnum.shippingChromium | SupportEnum.draft : SupportEnum.widelyAvailable;
		return apiInterceptor;
	});
}

const storageAPIInterceptorsGeneric = [
	{
		proxyHandler: {
			apply(_target, that, _args) {
				for (let i = 0; i < that.length; i++) {
					const key = that.key(i);
					if (key.startsWith(that.cookieStoreId))
						that.removeItem(key);
				}
			}
		} as ProxyHandler<Storage>,
		forStorage: true,
		globalProp: ".clear"
	},
	{
		genProxyHandler: storageNomenclatureHandlers.unprefix,
		forStorage: true,
		globalProp: ".getItem"
	},
	{
		genProxyHandler: ctx => ({
			apply(_target, that, args) {
				const [getIndex] = args;
				const proxifiedKeys: string[] = [];
				for (let i = 0; i < that.length; i++) {
					const key = that.key(i);
					if (key.startsWith(ctx.cookieStoreId))
						proxifiedKeys.push(that.unprefixKey(ctx.cookieStoreId, key));
				}
				return proxifiedKeys[getIndex];
			}
		}) as ProxyHandler<Storage>,
		forStorage: true,
		globalProp: ".key"
	},
	{
		genProxyHandler: storageNomenclatureHandlers.prefix,
		forStorage: true,
		globalProp: ".setItem"
	},
	{
		genProxyHandler: storageNomenclatureHandlers.unprefix,
		forStorage: true,
		globalProp: ".removeItem"
	},
] as APIInterceptor[];
