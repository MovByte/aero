import type { AeroSandboxFeaturesConfig } from "../../../types/aeroSandbox";
import { defaultSWProxyFeatures } from "../../../types/featureMembers";
import { type BuildConfig, BrowserEmulationFeatures, OsPassthroughFeatures } from "../../../types/buildConfig";

export default {
	proxyNamespaceObj: "$aero",
	aeroSandboxNamespaceObj: "sandbox",
	configKey: "config",
	featuresConfig: {
		/** These enum members enable code inside of the Proxy handler that provide other things you may want to use AeroSandbox for */
		specialInterceptionFeatures: defaultSWProxyFeatures,
		/** Browser Emulation features - Broadcast channel messages so that you can implement a proxy browser through a messaging API that will be documented soon on https://aero.sh/docs */
		browserExtras: BrowserEmulationFeatures.webApps,
		/** OS passthrough features - Broadcast channel messages so that you can implement OS passthrough support in your proxy browser through a messaging API that will be documented soon on https://aero.sh/docs */
		osExtras: "ALL",
	},
} as BuildConfig;
