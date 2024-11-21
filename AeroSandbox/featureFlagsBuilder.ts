// TODO: Create one of these for aero

import type { FeatureFlags } from "./build/featureFlags";

import rspack from "@rspack/core";

const snakeCaseMatch = /([a-z])([A-Z])/g;
const replacementSnakeCaseToUnderscoreCase = "$1_$2";

export default (featureFlagsRaw: FeatureFlags) => {
	const featureFlags: { [key: string]: string } = {};
	for (const [key, val] of Object.entries(featureFlagsRaw)) {
		const camelCaseToFeatureFlagFmtKey = key
			.replaceAll(snakeCaseMatch, replacementSnakeCaseToUnderscoreCase)
			.toUpperCase();
		featureFlags[camelCaseToFeatureFlagFmtKey] = JSON.stringify(typeof val === "bool" ? `($aero.config.sandbox.featureFlags.includeEsniff || ${val})` : val);
	}
	Object.freeze(featureFlags);
	return new rspack.DefinePlugin(featureFlags);
};
