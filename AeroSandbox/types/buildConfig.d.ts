import type { AeroSandboxFeaturesConfig } from "./aeroSandbox";

export interface BuildConfig {
	proxyNamespaceObj: string;
	aeroSandboxNamespaceObj: string;
	configKey: string;
	featuresConfig: AeroSandboxFeaturesConfig;
}
