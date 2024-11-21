/** @import { Config } from "aero-sandbox" */

/**
 * @type {Config}
 */
const defaultConfig = {
	proxyNamespace: "$aero",
	ourNamespace: "sandbox",
	configKey: "config",
	bundles: {
		main: "./sandbox.js",
		swAdditions: "./swAdditions.js",
		// APIs
		nestedSWs: "./nestedSWs.js",
		storageIsolator: "./storageIsolator.js",
		// Extra APIs (do not include these if you are making a SW proxy)
		ControlViews: "./ControlViews.js"
	},
	webrtcTurnServers: ["stun:stun.l.google.com:19302"],
	htmlSandboxElementName: "aero-html-sandbox",
	rewriters: {
		jsLib: self.JSRewriter,
		html: {
			lib: self.HTML
		}
	},
	featureFlags: "all",
	featureConfig: "all"
};

export default defaultConfig;
