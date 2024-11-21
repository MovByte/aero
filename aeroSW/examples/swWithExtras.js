/**
 * @type {string}
 */
const dirToAero = "/aero/";
/**
 * @type {string}
 */
const pathToPatchedAerohandler = `${dirToAero}extras/handleWithExtras.js`;

// configs
importScripts(`${dirToAero}defaultConfig.js`);
importScripts(`${dirToAero}config.js`);
// bare
importScripts(aeroConfig.bundles["bare-mux"]);
// aero handlers
importScripts(aeroConfig.bundles.handle);
importScripts(aeroConfig.bundles.logger);

importScripts(pathToPatchedAerohandler);

const aeroHandlerWithExtras = patchAeroHandler(aeroHandle);

addEventListener("install", skipWaiting);

addEventListener("fetch", event =>
	event.respondWith(aeroHandlerWithExtras(event))
);
