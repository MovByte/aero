/**
 * These types assume that you have already imported the Logger and BareMux bundle.
 */
// TODO: Import this in the global scope of handleSW.ts

import type { Config } from "$aero/types/config";
import type { default as BareMux_ } from "@mercuryworkshop/bare-mux";
import type { AeroLogger } from "$aero/AeroSandbox/build/Logger";

declare global {
	var config: Config;
	var aeroConfig: Config;
	var BareMux: BareMux_;
	var handle: unknown; // Replace with actual type
	var logger: AeroLogger;
	var nestedSWs: Map<proxyOrigin, NestedSW[]>;
	var storedValsForSandbox: { [key: string]: any };
}