import type BareClient from "@mercuryworkshop/bare-mux";
import type { AeroSandboxLogger } from "$shared/Loggers";
import type { Config } from "./config";
import type { SearchParamOptionsConfig } from "../../aeroSW/types/config";
import type JSRewriter from "$aero/src/sandboxers/JS/JSRewriter";

/** Everything in here is passthrough other than the `sandbox` prop */
export type AeroGlobalType = Readonly<{
	clientId: string;
	init: string;
	sec: {
		/** Content Security Policy from the navigation request that initiated this webpage @see https://content-security-policy.com */
		csp: readonly string[];
	};
	bc: BareClient;
	logger: AeroSandboxLogger;
	config: Config;
	searchParamOptions: SearchParamOptionsConfig;
	sandbox: {
		extLib: { [key: string]: any };
		rewriters: {
			js: JSRewriter;
		};
		appBadges: {
			proxyOrigin: string;
			contents: number;
		}[];
	};
}>;

declare global {
	// biome-ignore lint/style/noVar: <explanation>
	var $aero: AeroGlobalType;
}
