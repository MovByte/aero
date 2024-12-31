import { type APIInterceptor, SupportEnum } from "$types/apiInterceptors.d.ts";

import { createStorageNomenclatureHandlers } from "$util/storage";
import { proxyLocation } from "$shared/proxyLocation";

const storageNomenclatureHandlers = createStorageNomenclatureHandlers($aero.sandbox.config.idbStoreId);

export default [
	{
		/** Emulates for the `Clear-Site-Data` header */
		init() {
			const clear = $aero.sec.clear;
			const all = clear.includes("'*'");
			if (all || clear.includes("'storage'")) {
				indexedDB.databases().then(databases => {
					databases.forEach(db => {
						const [, proxyOriginForKey] = db.name.split("_");
						if (
							db?.name &&
							proxyOriginForKey === proxyLocation().origin
						) {
							indexedDB.deleteDatabase(db.name);
						}
					});
				});
			}
		},
		forCors: true,
		globalProp: "indexedDB",
		exposedContexts: "ALL",
		supports: SupportEnum.widelyAvailable
	},
	{
		proxyHandler: storageNomenclatureHandlers.prefix,
		forStorage: true,
		globalProp: "indexedDB.open",
		exposedContexts: "ALL",
		supports: SupportEnum.widelyAvailable
	},
	{
		proxyHandler: storageNomenclatureHandlers.prefix,
		forStorage: true,
		globalProp: "indexedDB.deleteDatabase",
		exposedContexts: "ALL",
		supports: SupportEnum.widelyAvailable
	},
	{
		proxifiedGetter(ctx) {
			return ctx.this.replace(new RegExp(`^${$aero.sandbox.config.idbStoreId}_`), "");
		},
		forStorage: true,
		exposedContexts: "ALL",
		globalProp: "IDBDatabase.name"
	}
] as APIInterceptor[];

