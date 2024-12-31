import type { AeroSandboxFeaturesConfig } from "./aeroSandbox";

export interface BuildConfig {
	proxyNamespaceObj: string;
	aeroSandboxNamespaceObj: string;
	configKey: string;
	featuresConfig: AeroSandboxFeaturesConfig;
}

type WebAppFor = "badge" | "install" | "launch";
export enum BrowserEmulationFeatures {
	/** Disables the default behavior of app badges and instead reports the changes to the app badge level to the SW with the Broadcast channel `$aero-browser-navigator` with types */
	webApps,
}

export enum OsPassthroughFeatures {
	fileDownload,
	filePicker,
}