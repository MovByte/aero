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

import type { ResultsSummary } from "../../../WPTUtils/types/diff";

// Utility
import { safeExec } from "../util/safeExec.ts";
import setupPatchedCLI from "./util/patchCLI.ts";
import writeNPMVersions from "../util/getNPMVersions.ts";
//import convertWptreportToExpectations from "../../../WPTUtils/src/convertWptreportToExpectations.ts";
/// For CLI
import unwrapGetActionYAML from "../../../WPTUtils/src/unwrapGetActionYAML.ts";

// For forming directory paths
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import * as flags from "flags";
import { envsafe, string, url } from "envsafe";

import { access, readFile, writeFile } from "node:fs/promises";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

interface OutputInfo {
	proxyName: string;
	proxyURL: string;
	wptRepo: string;
	browser: string;
	rootDir: string;
	checkoutDir: string;
	testResultsDir: string;
	runsFileOut: string;
	expectationsFileOut?: string;
}

/**
 * Runs the tests and writes the results to the `outdir` directory
 * @param param0 The context required configure how the tests are ran
 * @param param1 The options for optional files along with the WPT-Diff results
 */
async function runTests({
	proxyName,
	proxyURL,
	wptRepo,
	browser,
	checkoutDir,
	testResultsDir,
	runsFileOut,
	//expectationsFileOut
}: OutputInfo): Promise<ResultAsync<void, Error>> {
	const setupCLIRes = await setupPatchedCLI({ checkoutDir, browser, proxyName, proxyURL, wptRepo });
	if (setupCLIRes.isErr())
		return fmtNeverthrowErr("Failed to setup the patched WPT CLI, required to run the WPT-diff tests under aero", setupCLIRes.error.message);

	const patchedBrowser = `${proxyName}-${browser}`;

	let runResults: ResultsSummary;
	try {
		access(runsFileOut);
	} catch (err) {
		await safeExec(`wpt --headless --proxy ${patchedBrowser} --log-wptreport=${runsFileOut}`, { cwd: checkoutDir })
		const runResultsRaw = await readFile(runsFileOut, "utf-8");
		runResults = JSON.parse(runResultsRaw);
	}

	// TODO: Unfinished
	/*
	if (expectationsFileOut) {
		try {
			access(expectationsFileOut);
		} catch (err) {
			writeFile(expectationsFileOut, convertWptreportToExpectations(runResults));
		}
	}
	*/

	const writeNPMVersionsRes = await writeNPMVersions(testResultsDir);
	if (writeNPMVersionsRes.isErr())
		return fmtNeverthrowErr("Failed to write the NPM package versions for aero", writeNPMVersionsRes.error.message);

	return okAsync(undefined);
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
			PROXY_NAME: url({
				devDefault: "aero"
			}),
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
			proxyName: (flags.get("proxyURL") || env.PROXY_URL) as string,
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