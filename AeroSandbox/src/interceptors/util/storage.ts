/**
 * Note: The cookie store ID is so that we can store data from other storage types when the storage is exhausted from them. We need to know what is actually a cookie.
 * @module
 */

import { storagePrefix } from "$shared/storage";

function genStorageNomenclatureHandlers(storeId): { [key: string]: ProxyHandler<Storage> } {
	return {
		prefix: {
			apply: (target, that, args) => {
				const [key] = args;
				args[0] = prefixKey(storeId, key);
				return Reflect.apply(target, that, args);
			}
		},
		unprefix: {
			apply: (target, that, args) => {
				const [key] = args;
				args[0] = unprefixKey(storeId, key);
				return Reflect.apply(target, that, args);
			}
		}
	}
}


function prefixKey(prefix, key: string): string {
	let proxifiedKey = storagePrefix(key);
	if (prefix) {
		proxifiedKey = `${prefix}_${proxifiedKey}`;
	}
	return proxifiedKey;
}
/** Works for everything except Session Storage */
function unprefixKey(storeId: string, key: string): string {
	const storeIdKey = storagePrefix(storeId);
	if (!key.startsWith(storeIdKey))
		$aero.logger.fatalErr(`Failed to unprefix the key (the key does not have the expected cookie store key prefix, "${storeIdKey}")!`);
	const keyWithoutStoreIdKey = key.replace(new RegExp(`^${storeIdKey}`), "");
	return keyWithoutStoreIdKey;
}

export { genStorageNomenclatureHandlers, prefixKey, unprefixKey };