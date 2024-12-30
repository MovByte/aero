import { type APIInterceptor, SupportEnum } from "$types/apiInterceptors";

import createStorageAPIInterceptors from "$util/storageAPIInterceptorsGeneric";
import { proxyLocation } from "$shared/proxyLocation";

export default [
	...createStorageAPIInterceptors("sharedStorage", $aero.sandbox.config.sharedStorageId),
	...createStorageAPIInterceptors("storage", $aero.sandbox.config.storageStoreId),
	...createStorageAPIInterceptors("sessionStorage", `${$aero.sandbox.config.sessionStoreId}_${$aero.clientId}`),
	// This is needed for Session Storage only
	{
		init: () => {
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
		},
		globalProp: "sessionStorage",
		forStorage: true,
		supports: SupportEnum.widelyAvailable
	}
] as APIInterceptor[]
