import { type APIInterceptor, SupportEnum } from "$types/apiInterceptors.d.ts";

import { createStorageNomenclatureHandlers, unprefixKey } from "./storage";
import { storagePrefix } from "$shared/storage";

export default function createStorageApiInterceptors(key: string, storeId: string): APIInterceptor[] {
	const storageNomenclatureHandlers = createStorageNomenclatureHandlers(storeId);
	const storageAPIInterceptorsGeneric = [
		{
			proxyHandler: {
				apply(target, _that, _args) {
					const storageApi = key === "sessionStorage" ? localStorage : target;
					for (let i = 0; i < storageApi.length; i++) {
						const realKey = storageApi.key(i);
						const storeIdKey = storagePrefix(storeId);
						if (realKey.startsWith(storeIdKey))
							storageApi.removeItem(realKey);
					}
				}
			} as ProxyHandler<Storage>,
			globalProp: ".clear"
		},
		{
			proxyHandler: storageNomenclatureHandlers.unprefix,
			globalProp: ".getItem"
		},
		{
			proxyHandler: {
				apply(target, _that, args) {
					const storageApi = key === "sessionStorage" ? localStorage : target;
					const [getIndex] = args;
					const proxifiedKeys: string[] = [];
					for (let i = 0; i < storageApi.length; i++) {
						const realKey = storageApi.key(i);
						const storeIdKey = storagePrefix(storeId);
						if (realKey.startsWith(storeIdKey))
							proxifiedKeys.push(unprefixKey(storeId, realKey));
					}
					return proxifiedKeys[getIndex];
				}
			} as ProxyHandler<Storage>,
			globalProp: ".key"
		},
		{
			proxyHandler: storageNomenclatureHandlers.prefix,
			globalProp: ".setItem"
		},
		{
			proxyHandler: storageNomenclatureHandlers.unprefix,
			globalProp: ".removeItem"
		},
	] as APIInterceptor[];
	return storageAPIInterceptorsGeneric.map(apiInterceptor => {
		apiInterceptor.forStorage = true;
		apiInterceptor.globalProp = key + apiInterceptor.globalProp;
		apiInterceptor.supports = key === "sharedStorage" ? SupportEnum.shippingChromium | SupportEnum.draft : SupportEnum.widelyAvailable;
		return apiInterceptor;
	});
}