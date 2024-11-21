import type { APIInterceptor } from "$types/apiInterceptors.d.ts";

import { storageNomenclature } from "$util/shared";

export default [
	{
		storageProxifiedObj: cookieStoreId =>
			Proxy.revocable(indexedDB.open, storageNomenclature(cookieStoreId)),
		globalProp: "indexedDB.open"
	},
	{
		storageProxifiedObj: cookieStoreId =>
			Proxy.revocable(
				indexedDB.deleteDatabase,
				storageNomenclature(cookieStoreId)
			),
		globalProp: "indexedDB.deleteDatabase"
	},
	{
		storageProxifiedObj: cookieStoreId =>
			Proxy.revocable(indexedDB.databases, {
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
