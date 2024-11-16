/**
 * @module
 * This module is for formatting errors in a consistent way.
 * There is one of these for aero and one for AeroSandbox both in their `...shared/` folders.
 * This is because they may have different default feature flags.
 * This is similar to the one in `$shared/fmtError.ts,` but since this is a test file, the feature flags aren't built into a bundle, so they must be passed in, which is why this file is different.
 */

// This is where the difference between the two version is
import createDefaultFeatureFlags from "../../createDefaultFeatureFlags";

// Remember this file isn't built into a bundle because it is a test file, so this must be done
const defaultFeatureFlags = createDefaultFeatureFlags({ debugMode: false });

// biome-ignore lint/nursery/useImportRestrictions: This is fundementally how aero works and it keeps the code clean. I will continue to ignore this rule.
import createErrorFmters from "../../src/AeroSandbox/src/util/fmtErrorGeneric";

export const { fmtError, neverthrowFmtError } = createErrorFmters(defaultFeatureFlags.errorLogAfterColon);