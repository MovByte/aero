import { escapeWithOrigin } from "$util/escape";

const storagePrefix = escapeWithOrigin;

/**
 * Generic proxy handlers for methods that create means of storage
 * @param cookieStoreId The ID to prefix the argument in the call with (where the storage key is)
 */
const storageNomenclatureHandlers = cookieStoreId => {
	apply: (target, that, args) => {
		const [key] = args;

		let newKey = storagePrefix(key);
		if (cookieStoreId) {
			newKey = `${cookieStoreId}_${newKey}`;
		}
		args[0] = newKey;

		return Reflect.apply(target, that, args);
	};
};

function storageKey(key: string) {
	const getUnproxifiedStorageKey = key.split(storagePrefix(""));

	if (getUnproxifiedStorageKey[0] === storagePrefix(""))
		return getUnproxifiedStorageKey.slice(1);
	else return null;
}

function storageKeys(keys: string[]) {
	const proxyKeys = [];
	/*escapeWithProxyOrigin
	for (let key of keys) {
		const prefixSplit = key.split(storagePrefix());

		// FIXME:
		if (prefixSplit[0] === storagePrefix()) null; //proxyKeys.push(prefixSplit.slice(1).join(""));
	}
	*/
	Object.freeze(proxyKeys)

	return proxyKeys;
}

export { storageNomenclatureHandlers, storagePrefix, storageKey, storageKeys };
