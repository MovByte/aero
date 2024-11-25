import type BareClient from "@mercuryworkshop/bare-mux";
import type { AeroSandboxLogger } from "$shared/Loggers";
import type { Config } from "./config";
import type { SearchParamOptionsConfig } from "../../aeroSW/types/config";
import type JSRewriter from "$aero/src/sandboxers/JS/JSRewriter";

export interface AeroGlobalType {
	init: string;
	sec: {
		csp: string;
	};
	bc: BareClient;
	logger: AeroSandboxLogger;
	config: Config;
	searchParamOptions: SearchParamOptionsConfig;
	rewriters: {
		js: JSRewriter;
	};
}

declare global {
	// biome-ignore lint/style/noVar: <explanation>
	var $aero: AeroGlobalType;
}
