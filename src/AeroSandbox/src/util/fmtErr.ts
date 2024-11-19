/**
 * @module
 * This module is for formatting errors in a consistent way.
 */

import createErrorFmters from "./fmtErrGeneric";

export const { fmtErr, fmtNeverthrowErr } = createErrorFmters(ERR_LOG_AFTER_COLON);