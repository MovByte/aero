/**
 * @module
 */

import type { FeatureFlags } from "./build/featureFlags";

import rspack from "@rspack/core";

const snakeCaseMatch = /([a-z])([A-Z])/g;
const replacementSnakeCaseToUnderscoreCase = "$1_$2";

export default function featureFlagsBuilder(featureFlagsRaw: FeatureFlags) {
	return new rspack.DefinePlugin(featureFlagsBuilderRaw(featureFlagsRaw));
};

/**
 * This does the same thing functionally as `featureFlagsBuilder`, but it doesn't make it a plugin
 */
export function featureFlagsBuilderRaw(featureFlagsRaw: FeatureFlags) {
	const featureFlags: { [key: string]: string } = {};
	for (const [key, val] of Object.entries(featureFlagsRaw)) {
		const camelCaseToFeatureFlagFmtKey = key
			.replaceAll(snakeCaseMatch, replacementSnakeCaseToUnderscoreCase)
			.toUpperCase();
		featureFlags[camelCaseToFeatureFlagFmtKey] = JSON.stringify(typeof val === "boolean" ? `($aero.config.sandbox.featureFlags.includeEsniff || ${val})` : val);
	}
	Object.freeze(featureFlags);
	return featureFlags;
}