// Example: aero with other proxies in a SW switcher design. Includes optional support for the same proxies on the same route.

// Constants
/**
 * @type {string}
 */
const defaultProxy = "aero";
// Either a string or null
/**
 * @type {string | false}
 */
const sharedProxyRoute = false;
/**
 * @type {string}
 */
const dirToAero = "/aero/";
/**
 * @type {string}
 */
const dirToUV = "/uv/";

importScripts(`${dirToAero}defaultConfig.js`);
importScripts(`${dirToAero}config.js`);
importScripts(aeroConfig.bundles["bare-mux"]);
importScripts(aeroConfig.bundles.handle);
importScripts(`${dirToUV}uv.bundle.js`);
importScripts(`${dirToUV}uv.config.js`);
importScripts(__uv$config.sw || `${dirToUV}uv.sw.js`);

importScripts(`${dirToAero}/extras/handleWithExtras.js`);

const aeroHandlerWithExtras = patchAeroHandler(aeroHandle);
const uv = new UVServiceWorker();

addEventListener("install", skipWaiting);

// Switching on the same route
let chosenProxy = defaultProxy;
addEventListener("message", event => {
	if ("type" in event.data && event.data.type === "changeDefault") {
		const possibleChosenProxy = event.data.data;
		if (isValidProxy(possibleChosenProxy)) {
			chosenProxy = possibleChosenProxy;
		} else {
			console.log(
				`Fatal error: tried to set the default proxy, but the proxy to be set isn't supported: ${chosenProxy}`
			);
		}
	}
});

addEventListener("fetch", event => {
	if (sharedProxyRoute) {
		if (defaultProxy === "aero") {
			return event.respondWith(aeroHandlerWithExtras(event));
		}
		if (defaultProxy === "uv") {
			return event.respondWith(uv.handle(event));
		}
		let err = `Fatal error: there is no implementation for the default proxy provided: ${defaultProxy}`;
		if (!isValidProxy(defaultProxy)) {
			err = `Fatal error: trying to route to the default proxy, but the default proxy provided is invalid: ${defaultProxy}`;
		}
		console.error(err);
		return event.respondWith(
			() =>
				new Response(err, {
					status: 500
				})
		);
	}
	if (event.request.url.startsWith(location.origin + __uv$config.prefix)) {
		return event.respondWith(uv.fetch(event));
	}
	if (routeAero(event)) {
		return event.respondWith(aeroHandlerWithExtras(event));
	}
});

function isValidProxy(proxy) {
	return ["aero", "uv"].includes(proxy);
}
