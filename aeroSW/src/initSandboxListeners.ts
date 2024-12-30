// @ts-nocheck: I haven't yet made types for all of this

/**
 * Initialize all of the listeners for the sandbox
 */
export default function initSandboxListeners() {
	// For the utility method in AeroSandbox: `getValFromSW.ts`
	new BroadcastChannel("$aero-get-stored-val").onmessage((event: MessageEvent) => {
		if (event.data.for === "get")
			self.storedValsForSandbox[event.data.name] = event.data.val;
	});
}