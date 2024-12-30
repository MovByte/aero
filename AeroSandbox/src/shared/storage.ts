import { escapeWithOrigin } from "$util/escape";

const storagePrefix = escapeWithOrigin;

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

export { storagePrefix, storageKey, storageKeys };
