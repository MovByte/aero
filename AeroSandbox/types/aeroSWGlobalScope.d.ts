/**
 * These types assume that you have already imported the Logger and BareMux bundle.
 */
// TODO: Import this in the global scope of handleSW.ts

import type { Config } from "$aero/types/config";
import type { BareMux } from "@mercuryworkshop/bare-mux";
import type { AeroLogger } from "$aero/AeroSandbox/build/Logger";

interface AeroSWGlobalScope {
	config: Config;
	aeroConfig: Config;
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	BareMux: BareMux;
	handle;
	logger: AeroLogger;
	nestedSWs: Map<proxyOrigin, NestedSW[]>;
}

type proxyOrigin = string;
export declare const self: AeroSWGlobalScope &
	typeof globalThis & AeroSWGlobalScope;