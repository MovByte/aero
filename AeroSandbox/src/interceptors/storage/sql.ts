import { type APIInterceptor, SupportEnum } from "$types/apiInterceptors.d.ts";

const createHandler = (cookieStoreId?) => {
	return (target, that, args) => {
		const [key]: [string] = args;

		let newKey = $aero.aeroSandbox.config.storageKey + key;
		if (cookieStoreId) {
			newKey = `${cookieStoreId}_${newKey}`;
		}

		args[0] = newKey;

		const item = localStorage.getItem("dbNames");
		if (item !== null) {
			const dbNames: string[] = JSON.parse(item);
			if (dbNames.includes(newKey))
				localStorage.setItem(
					"dbNames",
					JSON.stringify(dbNames.push(newKey))
				);
		}

		return Reflect.apply(target, that, args);
	};
};

export default [
	{
		storageProxifiedObj: cookieStoreId =>
			Proxy.revocable(openDatabase, createHandler(cookieStoreId)),
		globalProp: "openDatabase",
		supports: SupportEnum.deprecated | SupportEnum.shippingChromium
	},
	{
		storageProxifiedObj: cookieStoreId =>
			Proxy.revocable(openDatabaseSync, createHandler(cookieStoreId)),
		globalProp: "openDatabaseSync",
		supports: SupportEnum.deprecated | SupportEnum.shippingChromium
	}
] as APIInterceptor[];
