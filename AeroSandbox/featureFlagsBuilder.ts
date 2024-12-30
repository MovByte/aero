/**
 * @module
 */

import type { FeatureFlags } from "./build/featureFlags";

import rspack from "@rspack/core";

/**
 * This is a regex to match the point in camelCase where there is a lowercase letter followed by an uppercase letter intended to be used to convert camelCase to snake_case (by making it separated by a `_` rather than a change in case)
 */
const snakeCaseMatch = /([a-z])([A-Z])/g
/**
 * This is the replacement regex for the regex `snakeCaseMatch` to convert that selected camelCase to snake_case
 */
const replacementSnakeCaseToUnderscoreCase = "$1_$2";

/**
 * Wrap `featureFlagsBuilderRaw` in an Rspack plugin
 * @param featureFlagsRaw The feature flags to pass to `featureFlagsBuilderRaw`
 * @returns The Rspack plugin
 */
export default function featureFlagsBuilder(featureFlagsRaw: FeatureFlags): object {
	return new rspack.DefinePlugin(featureFlagsBuilderRaw(featureFlagsRaw));
};

/**
 * Takes the feature flags object and converts it into the constant case format for the feature flags.
 * By "constant case format" I mean that it is in all caps and separated by underscores.
 * @param featureFlagsRaw The feature flags to convert into the constant case format
 * @returns The feature flags in the constant case format
 */
export function featureFlagsBuilderRaw(featureFlagsRaw: FeatureFlags): { [key: string]: string } {
	const featureFlags: { [key: string]: string } = {};
	for (const [key, val] of Object.entries(featureFlagsRaw)) {
		const camelCaseToFeatureFlagFmtKey = key
			.replaceAll(snakeCaseMatch, replacementSnakeCaseToUnderscoreCase)
			.toUpperCase();
		featureFlags[camelCaseToFeatureFlagFmtKey] = JSON.stringify(typeof val === "boolean" ? `($aero.config.featureFlags === "all" || $aero.config.featureFlags["${key}"] && ${val})` : val);
	}
	Object.freeze(featureFlags);
	return featureFlags;
}