import typia from "typia";

// @ts-ignore: you must run `npm i`
import type { GetLoadPing } from "$node_modules/proxy-middleware-bc/elecron-ipc/types/to-sandbox/transferDataReqs.ts"
import type { SendLoadPing } from "$types/ipc/Electron/toProxyMiddleware/transferDataResps";

// This section is for recording events that happen inside of a WebContent instance for the elements and methods that create them
/**
 * If this is an Electron WebView, we need to record the load event to the supplemental Electron IPC Browser Ports Middleware in case `webview.loadURL` is called
 */
if (
	// If this is an Electron WebView
	// @ts-ignore
	Object.keys($aero.sandbox.electronWebViewContents) > 0
) {
	let loadedFine = false;
	document.addEventListener("load", () => loadedFine = true);
	const recordLoadEventBc = new BroadcastChannel("$middleware-$electron-webview-get-load-ping");
	recordLoadEventBc.onmessage = (event: GetLoadPing) => {
		typia.validate<GetLoadPing>(event);
		// Wait a little longer
		if (!loadedFine) {
			document.addEventListener("load", () =>
				recordLoadEventBc.postMessage({
					for: "send",
					data: {
						loadedFine: true
					}
				} as SendLoadPing));
		}
	};
}
