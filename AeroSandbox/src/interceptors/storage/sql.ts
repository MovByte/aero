// TODO: Import @types for WebSQL

import { type APIInterceptor, SupportEnum } from "$types/apiInterceptors.d.ts";

import { escapeWithOrigin } from "$src/shared/escaping/escape";
import { prefixKey } from "$util/storage";

const sharedProxyHandler = {
	apply(target, that, args) {
		const [realKey]: [string] = args;
		const proxifiedKey = prefixKey($aero.sandbox.config.sqlStoreId, realKey);
		args[0] = proxifiedKey;
		const item = localStorage.getItem("$aero_dbNames");
		if (item !== null) {
			const dbNames: string[] = JSON.parse(item);
			if (dbNames.includes(proxifiedKey))
				localStorage.setItem(
					"$aero_dbNames",
					JSON.stringify(dbNames.push(proxifiedKey))
				);
		}
		return Reflect.apply(target, that, args);
	}
};

export default [
	{
		init: () => {
			const clear = $aero.sec.clear;
			const all = clear.includes("'*'");
			if (
				all || clear.includes("'storage'") && localStorage.hasItem("$aero_dbNames")
			) {
				const dbNames = localStorage.getItem("$aero_dbNames");
				if (dbNames !== null)
					for (const dbName of dbNames) {
						// @ts-ignore
						openDatabase(dbName).transaction(tx => {
							tx.executeSql(
								'SELECT name FROM sqlite_master WHERE type="table"',
								[],
								// @ts-ignore
								(tx, data) => {
									for (let i = 0; i < data.rows.length; i++) {
										const tableName = data.rows.item(i).name;
										if (
											tableName.startsWith(escapeWithOrigin("")) &&
											tableName !==
											"__WebKitDatabaseInfoTable__"
										)
											tx.executeSql(
												`DELETE FROM ${tableName}`
											);
									}
								}
							);
						});
					}
			}
		},
		proxyHandler: sharedProxyHandler,
		forCors: true,
		globalProp: "openDatabase",
		supports: SupportEnum.deprecated | SupportEnum.shippingChromium
	},
	{
		proxyHandler: sharedProxyHandler,
		globalProp: "openDatabaseSync",
		supports: SupportEnum.deprecated | SupportEnum.shippingChromium
	}
] as APIInterceptor[];
