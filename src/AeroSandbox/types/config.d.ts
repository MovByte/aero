import type JSRewriter from "$sandbox/JS/JSRewriter";
import type { FeatureFlags } from "./featureFlags";
import type { AeroSandboxFeaturesConfig } from "./aeroSandbox";

export type Config = {
	bundle: string;
	prefix: string;
	webrtcTurnServers: string[];
	/** This property is for Custom Elements "is" rewriting */
	htmlSandboxElementName: string;
	/** This is the runtime version that the user (through the Dynamic Config system if used) or site hoster can use to disable features in aero. Keep in mind these won't be tree shook out. **/
	rewriters: {
		js: JSRewriter;
		html: {
			ignoreClasses: string[];
		};
	};
	/** Remember the runtime version of the feature flags is limited to what aero is built with itself */
	featureFlags: FeatureFlags | "all";
	/** Remember the runtime version of the feature config is limited to what aero is built with itself */
	featuresConfig: AeroSandboxFeaturesConfig | "all";
};
