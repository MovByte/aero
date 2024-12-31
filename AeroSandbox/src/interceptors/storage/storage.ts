import { type APIInterceptor, SupportEnum } from "$types/apiInterceptors";

import createStorageAPIInterceptors from "$util/storageAPIInterceptorsGeneric";
import { proxyLocation } from "$shared/proxyLocation";
import { escapeWithOrigin } from "$shared/escaping/escape";

export default [
	...createStorageAPIInterceptors("sharedStorage", $aero.sandbox.config.sharedStorageId),
	...createStorageAPIInterceptors("storage", $aero.sandbox.config.storageStoreId),
	...createStorageAPIInterceptors("sessionStorage", `${$aero.sandbox.config.sessionStoreId}_${$aero.clientId}`),
	{
		init() {
			// For emulating the `Clear-Site-Data` header
			clearStoreAPI("localStorage");
		},
		globalProp: "localStorage",
		// Because of the emulation of the `Clear-Site-Data` header
		forCors: true,
		supports: SupportEnum.widelyAvailable
	},
	{
		init() {
			// For emulating the `Clear-Site-Data` header
			clearStoreAPI("sessionStorage");
		},
		globalProp: "sessionStorage",
		// Because of the emulation of the `Clear-Site-Data` header
		forCors: true,
		supports: SupportEnum.widelyAvailable
	},
	// This is needed for Session Storage only
	{
		init() {
			// Remove the keys from the previous sessions
			for (let i = 0; i < sessionStorage.length; i++) {
				const realKey = sessionStorage.key(i);
				if (realKey.startsWith(proxyLocation().origin)) {
					const keyWithoutOriginEscape = realKey.replace(new RegExp(`^${proxyLocation().origin}_`), "");
					if (
						// Is key from a previous session?
						keyWithoutOriginEscape.startsWith(`${$aero.sandbox.config.sessionStoreId}_`))
						sessionStorage.removeItem(realKey);
				}
			}

			// For emulating the `Clear-Site-Data` header
			clearStoreAPI("sessionStorage");
		},
		globalProp: "sessionStorage",
		forStorage: true,
		// Because of the emulation of the `Clear-Site-Data` header
		forCors: true,
		supports: SupportEnum.widelyAvailable
	}
] as APIInterceptor[]

/**
 * For emulating the `Clear-Site-Data` header
 * @param apiName The API name that implements the `Storage` interface
 */
function clearStoreAPI(apiName: string): void {
	if (apiName in window) {
		// @ts-ignore
		const storage = window[apiName];
		if (storage instanceof Storage) {
			for (const [key] of Object.entries(storage)) {
				if (key.startsWith(escapeWithOrigin(""))) {
					storage.removeItem(key);
				}
			}
		}
	}
}