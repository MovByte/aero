/**
 * @module
 * This module also contains a **CLI** that can be ran with `npx wpt-diff --package=@aero-tests/wpt-diff`
 * The CLI here is used for a *GitHub Action* in this repo that is meant for the public.
 * In addition, this module will be published on *NPM* and *JSR*.
 */

// Neverthrow
import type { ResultAsync } from "neverthrow";
import { okAsync, errAsync as nErrAsync } from "neverthrow";
import errLogAfterColon, { fmtNeverthrowErr } from "../util/fmtErrTest.ts";

// Utility
import checkoutRepo from "../util/checkoutRepo.ts";
import { safeExec } from "../util/safeExec.ts";
import getNPMVersions from "../util/getNPMVersions.ts";
import safeWriteFileToDir from "../util/safeWriteFileToDir.ts";
import unwrapGetActionYAML from "./shared/unwrapGetActionYAML.ts";

// For forming directory paths
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import * as flags from "flags";
import { envsafe, string, url } from "envsafe";

import { access } from "node:fs/promises";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

interface OutputInfo {
	proxyURL: string;
	wptRepo: string;
	browser: string;
	rootDir: string;
	checkoutDir: string;
	testResultsDir: string;
}

/**
 * Runs the tests and writes the results to the `outdir` directory
 * @param param0 The context required configure how the tests are ran
 */
async function runTests({
	proxyURL,
	wptRepo,
	browser,
	rootDir,
	checkoutDir,
	testResultsDir
}: OutputInfo): Promise<ResultAsync<void, Error>> {
	const setupCLIRes = await setupPatchedCLI();
	if (setupCLIRes.isErr())
		return fmtNeverthrowErr("Failed to setup the patched WPT CLI, required to run the WPT-diff tests under aero", setupCLIRes.error.message);

	/*
	if (access("TODO:..."))
		// Get results
		const { stdout, stderr } = await safeExec(`wpt ${browser} --headless --aero`, { cwd: "../checkouts/WPT" });
	*/
	// TODO: Write the results


	const writeNPMVersionsRes = await writeNPMVersions(testResultsDir);
	if (writeNPMVersionsRes.isErr())
		return fmtNeverthrowErr("Failed to write the NPM package versions for aero", writeNPMVersionsRes.error.message);

	return okAsync(undefined);
}

/**
 * Gets the WPT CLI and patches it for the *WPT-Diff* tests (to work under proxies)
 * This is a helper function meant to be for internal-use only, but it is exposed just in case you want to use it for whatever reason.
 */
async function setupPatchedCLI(): Promise<ResultAsync<void, Error>> {
	const checkoutRes = checkoutRepo("https://github.com/web-platform-tests/wpt", "../checkouts", "WPT");
	if (checkoutRes.isErr())
		return fmtNeverthrowErr("Failed to checkout the WPT tests", checkoutRes.error.message);


	// Patch the WPT CLI (make a flag called `--aero` that will be used to run the WPT tests under aero)

	return okAsync(undefined);
}

/**
 * The standard output as in `https://wpt.fyi/api/versions?product=...`; this will also be published with the GitHub Actions and shown on `https://aero.sh/stats/api/versions.json`
 * This is a helper function meant to be for internal-use only, but it is exposed just in case you want to use it for whatever reason.
 */
async function writeNPMVersions(outdir = resolve(__dirname, "testResults/api/versions.json")): Promise<ResultAsync<void, Error>> {
	const npmVersionsRes = await getNPMVersions();
	if (npmVersionsRes.isErr())
		return fmtNeverthrowErr("Failed to get the NPM package versions for aero", npmVersionsRes.error.message);
	const npmVersions = npmVersionsRes.value;

	await safeFileWriteToDir(outfile, JSON.stringify(npmVersions));
}

/**
 * Detect if the script is being ran as a CLI script and not as a module
 */
const isCLI =
	// For Deno
	// @ts-ignore: This is a Deno-only feature
	"Deno" in globalThis ? import.meta.main :
		// For Node (this does the same thing functionally as the above)
		// @ts-ignore
		import.meta.url === `file://${process.argv[1]}`;
/** Inputs that aren't supposed to correspond to CLI flags */
const ignoreInputs = ["wptDiffBaseCmd", "getRunInfoBaseCmd"];
if (isCLI) {
	(async () => {
		const defaultRootDir = resolve(__dirname, "../../../");
		const defaultTestResultsDir = resolve(defaultRootDir, "testResults");
		const env = envsafe({
			PROXY_URL: url({
				devDefault: "http://localhost:2525/go/"
			}),
			WPT_REPO: url({
				devDefault: "https://github.com/web-platform-tests/wpt"
			}),
			BROWSER: string({
				devDefault: "chrome"
			}),
			ROOT_DIR: string({
				devDefault: defaultRootDir
			}),
			CHECKOUT_DIR: string({
				devDefault: resolve(defaultRootDir, "checkouts/WPT")
			}),
			TEST_RESULTS_DIR: string({
				devDefault: defaultTestResultsDir
			}),
			RUNS_FILE_OUT: string({
				devDefault: resolve(defaultTestResultsDir, "runs.json")
			}),
			EXPECTATIONS_FILE_OUT: string({
				devDefault: resolve(defaultTestResultsDir, "baseline-expectations.json")
			})
		});

		const actionYAML = await unwrapGetActionYAML();
		for (const [inputName, inputDesc] of Object.entries(actionYAML.on.workflow_dispatch.inputs))
			if (!ignoreInputs.includes(inputName))
				flags.defineString(inputName).setDescription(inputDesc);
		flags.parse();

		const runTestsRes = await runTests({
			proxyURL: (flags.get("proxyURL") || env.PROXY_URL) as string,
			wptRepo: (flags.get("wptRepo") || env.WPT_REPO) as string,
			browser: (flags.get("browser") || env.BROWSER) as string,
			rootDir: (flags.get("rootDir") || env.ROOT_DIR) as string,
			checkoutDir: (flags.get("checkoutDir") || env.CHECKOUT_DIR) as string,
			testResultsDir: (flags.get("testResultsDir") || env.TEST_RESULTS_DIR) as string,
			// @ts-ignore
			runsFileOut: (flags.get("runsFileOut") || env.RUNS_FILE_OUT) as string,
			expectationsFileOut: (flags.get("expectationsFileOut") || env.EXPECTATIONS_FILE_OUT) as string
		});
		if (runTestsRes.isErr())
			throw new Error(`Failed to run the tests${errLogAfterColon}${runTestsRes.error.message}`);
	});
}