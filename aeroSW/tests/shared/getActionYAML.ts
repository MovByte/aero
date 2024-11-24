/**
 * @module
 * This module is intended for CLI scripts that can be ran through `npx`, have GitHub actions, and want to use the same descriptions from their corresponding GitHub Action files 
 */

// Neverthrow
import type { ResultAsync } from "neverthrow";
import { okAsync, errAsync as nErrAsync } from "neverthrow";
import { fmtNeverthrowErr } from "../shared/fmtErrTest";

// For forming directory paths
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { readFile } from "node:fs/promises";
import safeWriteFileToDir from "../shared/safeWriteFileToDir";

import { parse } from "yaml";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

/**
 * Get the YAML as a JS object for the current GitHub Action
 * @param actionName The target YAML filename for the current GitHub Action 
 */

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export default async function getActionYAML(actionName: string, aeroRepo = "https://github.com/vortexdl/aero.git"): Promise<ResultAsync<any, Error>> {
	const ymlPath = resolve(__dirname, `.github/workflows/${actionName}.yml`);

	let actionYAMLRaw: string;
	// We try this because the CLI might be ran inside of a checkout of the repo (rare and doesn't occur in GitHub Actions)
	try {
		actionYAMLRaw = await readFile(ymlPath, "utf-8");
	} catch (err) {
		let yamlResp: Response;
		// It must be ran through a *GitHub Action* or through `npx` then
		try {
			yamlResp = await fetch(`https://raw.githubusercontent.com/vortexdl/aero/refs/heads/untested/.github/actions/${aeroRepo}`);
			if (!yamlResp.ok)
				return fmtNeverthrowErr(`THe status for the ${actionName} YAML file (for the GitHub Action) fetched from the from the GitHub repo, ${aeroRepo}, is invalid`, err.message);
			actionYAMLRaw = await yamlResp.text();
		} catch (err) {
			return nErrAsync(`Failed to fetch the ${actionName} YAML file (for the GitHub Action) from the GitHub repo, ${aeroRepo}`)
		}
	}

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	let actionYAMLParsed: any;
	try {
		actionYAMLParsed = parse(actionYAMLRaw);
	} catch (err) {
		return fmtNeverthrowErr(`Failed to parse the ${actionName} YAML file (for the GitHub Action)`, err.message);
	}
	return okAsync(actionYAMLParsed);
}