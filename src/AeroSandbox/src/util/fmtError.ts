/**
 * @module
 * This module is for formatting errors in a consistent way.
 */

import createErrorFmters from "./fmtErrorGeneric";

export const { fmtError, neverthrowFmtError } = createErrorFmters(ERROR_LOG_AFTER_COLON);