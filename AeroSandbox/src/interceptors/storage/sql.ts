import { type APIInterceptor, SupportEnum } from "$types/apiInterceptors.d.ts";
import { proxyLocation } from "$shared/proxyLocation";

/**
 */
const createHandler = () => {
	return (target, that, args) => {
		const [key]: [string] = args;

		const newKey = `${proxyLocation().origin}_sql_${key}`;

		args[0] = newKey;

		const item = localStorage.getItem("dbNames");
		if (item !== null) {
			const dbNames: readonly string[] = JSON.parse(item);
			if (dbNames.includes(newKey))
				localStorage.setItem(
					"dbNames",
					JSON.stringify(dbNames.push(newKey))
				);
		}

		return Reflect.apply(target, that, args);
	};
};

// FIXME: This is all deprecated way of doing thiigs
export default [
	{
		createStorageProxyHandlers: cookieStoreId =>
			Proxy.revocable(openDatabase, createHandler(cookieStoreId)),
		globalProp: "openDatabase",
		supports: SupportEnum.deprecated | SupportEnum.shippingChromium
	},
	{
		createStorageProxyHandlers: cookieStoreId =>
			Proxy.revocable(openDatabaseSync, createHandler(cookieStoreId)),
		globalProp: "openDatabaseSync",
		supports: SupportEnum.deprecated | SupportEnum.shippingChromium
	}
] as APIInterceptor[];
