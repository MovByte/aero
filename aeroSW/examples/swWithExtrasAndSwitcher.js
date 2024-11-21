// Example: aero with other proxies in a SW switcher design
// Constants
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
importScripts(__uv$config.sw || `${dimrToUV}uv.sw.js`);

importScripts(`${dirToAero}/extras/handleWithExtras.js`);

const aeroHandlerWithExtras = patchAeroHandler(aeroHandle);
const uv = new UVServiceWorker();

addEventListener("install", skipWaiting);

addEventListener("fetch", event => {
	if (event.request.url.startsWith(location.origin + __uv$config.prefix)) {
		return event.respondWith(uv.fetch(event));
	}
	if (routeAero(event)) {
		return event.respondWith(aeroHandlerWithExtras(event));
	}
});
