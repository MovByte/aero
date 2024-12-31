/**
 * Installs the external libraries library into the global namespace `$aero`.
 * This must be included as a bundle in the `rspack.config.ts` file and imported as such (as a module) in aero's SW handler when rewriting HTML, so that the bundle can be registered, and setup in the global namespace.
 */

import { createWorker } from "await-async";
import { Hls } from "hls.js";
import { dashjs } from "dashjs";

// ext as in external
// Init external libs used in AeroSandbox
{
	// Setup *await-async* on the global proxy namespace
	window[PROXY_NAMESPACE_OBJ][AERO_SANDBOX_NAMESPACE_OBJ].extLib.syncify = await createWorker();
	// Setup *hls.js* on the global proxy namespace
	window[PROXY_NAMESPACE_OBJ][AERO_SANDBOX_NAMESPACE_OBJ].extLib.Hls = Hls;
	// Setup *dashjs*
	window[PROXY_NAMESPACE_OBJ][AERO_SANDBOX_NAMESPACE_OBJ].extLib.dashjs = dashjs;
}
