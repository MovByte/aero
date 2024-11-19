/**
 * @module
 * This module is for formatting errors in a consistent way.
 * There is one of these for aero and one for AeroSandbox both in their `...shared/` folders.
 * This is because they may have different default feature flags.
 * This is similar to the one in `$shared/fmtErr.ts,` but since this is a test file, the feature flags aren't built into a bundle, so they must be passed in, which is why this file is different.
 */

// This is where the difference between the two version is
// @ts-ignore This is a module inside of a test, which means it isn't built, but run directly by node, so ignore what the linter says
import createDefaultFeatureFlags from "../../createDefaultFeatureFlags.ts";

// @ts-ignore This is a module inside of a test, which means it isn't built, but run directly by node, so ignore what the linter says
const defaultFeatureFlags = createDefaultFeatureFlags({ debugMode: false });

// @ts-ignore This is a module inside of a test, which means it isn't built, but run directly by node, so ignore what the linter says
import createErrorFmters from "../../src/util/fmtErrGeneric.ts";

export const { fmtErr, fmtNeverthrowErr } = createErrorFmters(defaultFeatureFlags.errLogAfterColon);
