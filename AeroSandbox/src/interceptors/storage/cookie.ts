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
		createStorageProxyHandlers: cookieStoreId => {
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


export default [{
	/** Emulates for the `Clear-Site-Data` header */
	init() {
		const clear = $aero.sec.clear;
		const all = clear.includes("'*'");
		if (all || clear.includes("'cookies'")) {
			clearCookies(upToProxyOrigin());
		}
		if (all || clear.includes("'executionContexts'")) {
			// This is done here and not in other other storage interceptors because cookies would be the most supported
			navigator.serviceWorker.addEventListener("message", event => {
				if (event.data === "$aero_clearExecutionContext") location.reload();
			});
		}
	},
	proxifiedGetter: ctx => {
		return rewriteGetCookie(ctx.this, proxyLocation())
	},
	proxifiedSetter: ctx => {
		return rewriteSetCookie(ctx.this, proxyLocation())
	},
	globalProp: "document.cookie"
}] as APIInterceptor[];

function clearCookies(path: string) {
	const cookies = document.cookie.split(";");

	for (const cookie of cookies) {
		const eqPos = cookie.indexOf("=");

		const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;

		document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
	}
}