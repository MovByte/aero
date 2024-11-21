/**
 * @module
 * This module is for formatting errors in a consistent way.
 */

import createErrFmters from "./fmtErrGeneric";

export const { fmtErr, fmtNeverthrowErr } = createErrFmters(ERR_LOG_AFTER_COLON);