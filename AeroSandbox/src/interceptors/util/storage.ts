import { type GeneratorCtxTypeProxyHandler } from "$types/apiInterceptors";

import { storagePrefix } from "$shared/storage";

const storageNomenclatureHandlers: { [key: string]: GeneratorCtxTypeProxyHandler } = {
	prefix: (ctx) => ({
		apply: (target, that, args) => {
			const [key] = args;
			args[0] = prefixKey(ctx.cookieStoreId, key);
			return Reflect.apply(target, that, args);
		}
	} as ProxyHandler<Storage>),
	unprefix: (ctx) => ({
		apply: (target, that, args) => {
			const [key] = args;
			args[0] = unprefixKey(ctx.cookieStoreId, key);
			return Reflect.apply(target, that, args);
		}
	} as ProxyHandler<Storage>),
};

function prefixKey(cookieStoreId, key: string): string {
	let proxifiedKey = storagePrefix(key);
	if (cookieStoreId) {
		proxifiedKey = `${cookieStoreId}_${proxifiedKey}`;
	}
	return proxifiedKey;
}
function unprefixKey(cookieStoreId, key: string): string {
	if (!key.startsWith(cookieStoreId))
		$aero.logger.fatalErr("Failed to unprefix the key (the key does not belong to the current cookie store)");
	const keyWithoutCookieStoreId = key.replace(new RegExp(`^${cookieStoreId}`), "");
	if (!keyWithoutCookieStoreId.startsWith(storagePrefix("")))
		$aero.logger.fatalErr("Failed to unprefix the key (the key does not have the storage prefix)");
	return keyWithoutCookieStoreId.replace(storagePrefix(""), "");
}

export { storageNomenclatureHandlers };