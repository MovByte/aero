/**
 * @type {string}
 */
const dirToAero = "/aero/";

importScripts(`${dirToAero}defaultConfig.js`);
importScripts(`${dirToAero}config.js`);
importScripts(aeroConfig.bundles["bare-mux"]);
importScripts(aeroConfig.bundles.handle);

addEventListener("install", skipWaiting);

addEventListener("fetch", event => event.respondWith(aeroHandle(event)));
