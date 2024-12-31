import { escapeWithOrigin } from "$util/escape";

function storageKey(key: string) {
	const getUnproxifiedStorageKey = key.split(escapeWithOrigin(""));

	if (getUnproxifiedStorageKey[0] === escapeWithOrigin(""))
		return getUnproxifiedStorageKey.slice(1);
	else return null;
}

function storageKeys(keys: string[]) {
	const proxyKeys = [];
	/*escapeWithProxyOrigin
	for (let key of keys) {
		const prefixSplit = key.split(escapeWithOrigin());

		// FIXME:
		if (prefixSplit[0] === escapeWithOrigin()) null; //proxyKeys.push(prefixSplit.slice(1).join(""));
	}
	*/
	Object.freeze(proxyKeys)

	return proxyKeys;
}

export { storageKey, storageKeys };
