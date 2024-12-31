/**
 * @module
 */

import CacheManager from "$fetchHandlers/isolation/CacheManager";
import HstsCacheEmulation from "../fetchHandlers/isolation/HstsCacheEmulation";

// @ts-nocheck: I haven't yet made types for all of this

/**
 * Initialize all of the listeners for the sandbox
 */
export default function initSandboxListeners() {
	// For the utility method in AeroSandbox: `getValFromSW.ts`
	new BroadcastChannel("$aero-stored-val").onmessage((event: MessageEvent) => {
		switch (event.data.for) {
			case "get":
				self.postMessage({
					for: "get",
					name: event.data.name,
					val: self.storedValsForSandbox[event.data.name]
				});
				break;
			case "set":
				self.storedValsForSandbox[event.data.name] = event.data.val;
				break;
			default:
				$aero.logger.fatalErr(`Invalid message type, \`${event.data.for}\`, for \`$aero-stored-val\`!`);
		}
	});

	// For the utility method in AeroSandbox: `getValFromSW.ts`
	if (CACHES_EMULATION)
		new BroadcastChannel("$aero-clear-execution-context").onmessage((event: MessageEvent) => {
			if (!("proxyOrigin" in event.data))
				throw new Error(fmtMissingPropForClearExecutionContextErr("proxyOrigin"));
			CacheManager.clear(event.data.proxyOrigin)
			HstsCacheEmulation.clear(event.data.proxyOrigin)
		});
}

function fmtMissingPropForAeroStoredValErr(prop: string) {
	return fmtMissingPropGenericErr(prop, "$aero-stored-val");
}
function fmtMissingPropForClearExecutionContextErr(prop: string) {
	return fmtMissingPropGenericErr(prop, "$aero-clear-execution-context", "while clearing execution context for the `Clear-Site-Data` header");
}
function fmtMissingPropGenericErr(prop: string, chanName: string, conciseExplanation?: string) {
	$aero.logger.fatalErr(`Expected \`${prop}\` in message data for the message to \`${chanName}\`${conciseExplanation ? ` (${conciseExplanation})` : ""}`);
}