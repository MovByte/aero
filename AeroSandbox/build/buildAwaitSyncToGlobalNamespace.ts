/**
 * Installs the await-async library into the global namespace `$aero`.
 * This must be included as a bundle in the `rspack.config.ts` file and imported as such (as a module) in aero's SW handler when rewriting HTML, so that the bundle can be registered, and setup in the global namespace.
 */

import { createWorker } from "await-async";

const awaitAsync = createWorker();

// ext as in external
window[PROXY_NAMESPACE_OBJ][AERO_SANDBOX_NAMESPACE_OBJ].ext.awaitAsync = awaitAsync();
