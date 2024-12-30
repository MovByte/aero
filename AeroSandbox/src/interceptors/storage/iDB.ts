import { type APIInterceptor, SupportEnum } from "$types/apiInterceptors.d.ts";

import { storageNomenclatureHandlers } from "$util/storage";

export default [
	{
		genProxyHandler: ctx => storageNomenclatureHandlers(ctx.cookieStoreId),
		forStorage: true,
		globalProp: "indexedDB.open",
		supports: SupportEnum.widelyAvailable
	},
	{
		genProxyHandler: ctx => storageNomenclatureHandlers(ctx.cookieStoreId),
		forStorage: true,
		globalProp: "indexedDB.deleteDatabase",
		supports: SupportEnum.widelyAvailable
	},
	{
		genProxyHandler: ctx => ({
			async apply(target, that, args) {
				const dbs = (await Reflect.apply(
					target,
					that,
					args
				)) as IDBDatabaseInfo[];

				dbs.map(db => {
					if (db instanceof Error) return db;

					let proxifiedName = $aero.config.prefix + db.name;
					if (proxifiedName) proxifiedName = `${ctx.cookieStoreId}_${proxifiedName}`;
					db.name = proxifiedName;

					return db;
				});
			}
		}),
		forStorage: true,
		globalProp: "indexedDB.databases",
		supports: SupportEnum.widelyAvailable
	}
] as APIInterceptor[];
