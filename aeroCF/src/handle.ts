import handle from "$sw/src/handle";
import getReqDest from "./fetchHelpers/getReqDest";
import patchHandler from "$sw/extras/handleWithExtras.js";

// Bring in features that are not available in the SW environment
self.getReqDest = getReqDest;
/** This is as an alternative to *BareMux* */
self.serverFetch = fetch;

export default patchHandler(handle);