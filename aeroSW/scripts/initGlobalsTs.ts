/**
 * @module
 */

// Neverthrow
import type { Result } from "neverthrow";
import { err as nErr, ok } from "neverthrow";
import { fmtNeverthrowErr } from "../tests/shared/fmtErrTest.ts";

import { accessSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { default as createDefaultFeatureFlags } from "../createDefaultFeatureFlags.ts"
import { featureFlagsBuilderRaw } from "../../AeroSandbox/featureFlagsBuilder.ts";

/**
 * Inits the feature flags in the global scope for TS files, so that they won't error in your IDE 
 * @param output The TS types file to output to
 * @param createDefaultFeatureFlags The method to create the default feature flags from
 * @returns The result of the operation wrapped in a `Result` from *Neverthrow* for better error handling
 */
export default function initGlobalsTs(
	output = "../types/dist/biome/globals.d.ts",
	createDefaultFeatureFlags_ = createDefaultFeatureFlags,
): Result<void, Error> {
	const relOutput = path.resolve(__dirname, output);

	const featureFlags = featureFlagsBuilderRaw({
		...createDefaultFeatureFlags_({
			debugMode: true,
		})
	});

	const lines: string[] = ["export { };", "", "declare global {"];
	for (const [featureFlag, val] of Object.entries(featureFlags)) {
		try {
			// @ts-ignore: it could be anything. There is a try statement if something goes wrong anyways
			console.log(featureFlag, val);
			const jsonParsed = JSON.parse(val);
			const valType = typeof jsonParsed;
			if (valType === "number" || valType === "string" || Array.isArray(jsonParsed))
				lines.push(`\tconst ${featureFlag}: ${valType};`);
			else
				return nErr(
					new SyntaxError(
						`Unexpected type for feature flag, ${featureFlag}, ${valType}`,
					),
				);
		} catch (err) {
			return nErr(err);
		}
	}
	lines.push("}");

	const dirsLeading = path.dirname(relOutput);
	try {
		accessSync(dirsLeading);
	} catch (_err) {
		mkdirSync(dirsLeading, {
			recursive: true
		})
	}

	console.log(relOutput);
	try {
		writeFileSync(
			relOutput,
			`// Autogenerated by \`initGlobalsTs.ts\`\n${lines.join("\n")}`,
			{
				flag: "w",
			},
		);
	} catch (err) {
		return fmtNeverthrowErr("Failed to write the feature flags to the globals TS types file", err);
	}

	return ok(undefined);
}

/**
 * Detect if the script is being ran as a CLI script and not as a module
 */
const isCLI =
	// For Deno
	// @ts-ignore: This is a Deno-only feature
	"Deno" in globalThis ? import.meta.main :
		// For Node (this does the same thing functinally as the above)
		import.meta.url === `file://${process.argv[1]}`;
if (isCLI) {
	const initGlobalsTsRes = initGlobalsTs();
	if (initGlobalsTsRes.isErr()) {
		throw initGlobalsTsRes.error;
	}
}
