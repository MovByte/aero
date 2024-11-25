import type { APIInterceptor } from "$aero/types/apiInterceptors";

import { proxyLocation, upToProxyOrigin } from "$shared/proxyLocation";

import { rewriteGetCookie, rewriteSetCookie } from "$shared/cookie";

function getOriginalCookie(cookie) {
	// Not done
	return cookie;
}

let apiInterceptors: APIInterceptor = [];

// Get the types for the cookieStore API and import them in index.d.ts for us here
if ("cookieStore" in window) {
	apiInterceptors.push({
		storageProxifiedObj: cookieStoreId => {
			return Proxy.revocable(cookieStore.set, {
				apply(target, that, args) {
					const [cookie] = args;

					// TODO: Isolate contextual identity

					cookie.domain = proxyLocation().domain;
					cookie.path = upToProxyOrigin() + cookie.path;

					args[0] = cookie;

					return Reflect.apply(target, that, args);
				}
			});
		},
		globalProp: "cookieStore.set"
	});
	//cookieStore.set =
	/*
	cookieStore.get = new Proxy(cookieStore.set, {
		apply(target, that, args) {
			return getOriginalCookie(
				prefix,
				Reflect.apply(target, that, args)
			);
		},
	});
	*/
	cookieStore.addEventListener = new Proxy(cookieStore.addEventListener, {
		apply(target, that, args) {
			const [type, listener] = args;

			if (type === "change")
				args[1] = event => {
					if (event instanceof CookieChangeEvent) {
						/*
						TODO: Rewrite
						event.changed
						event.deleted
						*/
					}

					event.listener(event);
				};

			return Reflect.apply(target, that, args);
		}
	});
}

{
	let cookieBak = document.cookie;
	Object.defineProperty(document, "cookie", {
		get: () => rewriteGetCookie(cookieBak, proxyLocation()),
		set: value => (cookieBak = rewriteSetCookie(value, proxyLocation()))
	});
}
