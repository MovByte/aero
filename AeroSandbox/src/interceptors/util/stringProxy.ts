import sharedConfig from "./sharedConfig";

import { afterPrefix } from "./getProxyURL";

function proxy(
	api: string,
	// biome-ignore lint/complexity/noBannedTypes: <explanation>
	mapRewriteArgs?: Map<number, Function>,
	// biome-ignore lint/complexity/noBannedTypes: <explanation>
	rewriteResult?: Function
): ProxyHandler<object> {
	if (api in window)
		return new Proxy(window[api], {
			apply(target, that, args) {
				if (mapRewriteArgs)
					for (const [argNum, rewrite] of mapRewriteArgs.entries())
						if (rewrite) args[argNum] = rewrite(...args);

				let ret = Reflect.apply(target, that, args);

				if (rewriteResult) ret = rewriteResult(ret, ...args);

				return ret;
			}
		});
}

function proxyGet(
	api: string,
	// biome-ignore lint/complexity/noBannedTypes: <explanation>
	mapReplaceProps: Map<string, Function>
): ProxyHandler<object> {
	if (api in window)
		return new Proxy(window[api], {
			get(target, theProp) {
				if (
					typeof theProp === "string" &&
					mapReplaceProps.has(theProp)
				) {
					const handler = mapReplaceProps.get(theProp);
					if (handler) return handler(theProp);
				}

				return Reflect.get(target, theProp);
			}
		});
}

function proxyConstructString(
	apiName: string,
	argNums?: number[],
	res?: boolean
): ProxyHandler<object> {
	if (argNums) {
		const map = new Map<number, (...args: string[]) => string>();

		// I forgot what this is for
		for (const argNum of argNums)
			map.set(argNum, () => {
				return sharedConfig("prefix") + arguments[argNum];
			});

		return proxy(apiName, map);
	}
	if (res)
		return proxy(apiName, undefined, (res: string) => afterPrefix(res));
}
function proxyGetString(
	apiName: string,
	props: string[]
): ProxyHandler<object> {
	const map = new Map();

	for (const prop of props) map.set(prop, afterPrefix);

	return proxyGet(apiName, map);
}

export default proxy;
export { proxyConstructString, proxyGetString };
