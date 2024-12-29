import type { APIInterceptor } from "$types/apiInterceptors.d.ts";

import { storageNomenclatureHandlers } from "$util/shared";

export default [
	{
		createStorageProxyHandlers: cookieStoreId => storageNomenclatureHandlers(cookieStoreId),
		globalProp: "indexedDB.open"
	},
	{
		createStorageProxyHandlers: cookieStoreId => storageNomenclatureHandlers(cookieStoreId),
		globalProp: "indexedDB.deleteDatabase"
	},
	{
		createStorageProxyHandlers: cookieStoreId => ({
			async apply(target, that, args) {
				const dbs = (await Reflect.apply(
					target,
					that,
					args
				)) as IDBDatabaseInfo[];

				dbs.map(db => {
					if (db instanceof Error) return db;

					let newName = aeroConfig.prefix + db.name;
					if (newName) newName = `${cookieStoreId}_${newName}`;
					db.name = newName;

					return db;
				});
			}
		}),
		globalProp: "indexedDB.databases"
	}
] as APIInterceptor[];
