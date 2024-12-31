/**
 * @module
 * This module also contains a **CLI** that can be ran with TODO:...
 */

// Neverthrow
import type { ResultAsync } from "neverthrow";
import { okAsync, errAsync as nErrAsync } from "neverthrow";
import { fmtNeverthrowErr, fmtErr } from "../shared/fmtErrTest";

// Utility
import getNPMVersions from "../shared/getNPMVersions";
import unwrapGetActionYAML from "./shared/unwrapGetActionYAML";

// For forming directory paths
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import safeWriteFileToDir from "../shared/safeWriteFileToDir";

import * as flags from "flags";
import { envsafe, string } from "envsafe";

/**
 * @module
 * This module contains utility functions for sites like *aero.sh* to form JSON data to serve on their WPT APIs. Those same sites will use their own API with their client JS to fill in the Polymer elements @see https://github.com/web-platform-tests/wpt.fyi/tree/main with the data.  
 */

/**
 * Form the whole `runs.json` file, but just with the aero run info and the browser it was run on (for comparison).
 * This function will be used by aero.sh as an API route on `https://aero.sh/stats/api/runs.json`.
 * That same stats site will draw out the same Polymer data charts from *wpt.fyi*
 * @see https://wpt.fyi/api/runs?label=experimental&label=master&aligned
 * 
 * @param browser The browser that the WPT-diff tests were run on
 */
export default async function getRunsInfoRes(browser: string, outfile: string): Promise<ResultAsync<any, Error>> {
	let runsResp: Response;
	try {
		runsResp = await fetch("https://wpt.fyi/api/runs?label=experimental&label=master&aligned");
	} catch (err) {
		return fmtNeverthrowErr("Failed to fetch the WPT Runs info from the wpt.fyi API", err.message);
	}
	if (!runsResp.ok)
		return fmtNeverthrowErr("The status was invalid when trying to fetch the WPT Runs info from the wpt.fyi API", runsResp.status);
	if (!runsResp.headers.has("content-type"))
		return nErrAsync("There is no content-type header, so it is not safe to assume the response back is a JSON. Perhaps the WPT API is down?");
	// @ts-ignore: We have already checked if the content-type is present
	if (!runsResp.headers.get("content-type").includes("application/json"))
		return fmtNeverthrowErr("The content type was not a JSON when trying to fetch the WPT Runs info from the wpt.fyi API", runsResp.headers.get("content-type"));
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	let runsInfoJSON: any;
	try {
		runsInfoJSON = await runsResp.json();
	} catch (err) {
		return fmtNeverthrowErr("Failed to parse the WPT Runs JSON, which was expected to contain the WPT runs info we need", err.message);
	}

	const runsInfoBrowser = runsInfoJSON.runs.find((run: any) => run.browser_name === browser);
	if (!runsInfoBrowser)
		return nErrAsync(`The browser you chose, ${browser}, was not found in the default WPT runs info`);

	/** Meant to be an object in the array of the runs in the `runs.json` file. See @https://wpt.fyi/api/runs?label=experimental&label=master&aligned. */
	return getRunsInfoObjJSON(runsInfoJSON);
}

/**
 * This is a helper function for `getRunsInfoRes` meant to be for internal-use only, but it is exposed just in case you want to use it for whatever reason.
 */

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
function getRunsInfoObjJSON(originalBrowserRunsInfo: any): any {
	const runsInfo = [
		labels: originalBrowserRunsInfo.labels
	]
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
import.meta.url === `file://${process.argv[1]}`;
const includeInputs = ["browser", "testResultsDir", "outfilePath"];
if (isCLI)
	(async () => {
		const __dirname = fileURLToPath(new URL(".", import.meta.url));

		const env = envsafe({
			BROWSER: string({
				devDefault: "chrome"
			}),
			TEST_RESULTS_DIR: string({
				devDefault: resolve(__dirname, "../../../testResults")
			}),
			OUTFILE_PATH: string({
				devDefault: resolve(__dirname, "../../../testResults/api/runs.json")
			}),
		});

		const actionYAML = await unwrapGetActionYAML();
		const inputs = actionYAML.on.workflow_dispatch.inputs;
		for (const includeInput of includeInputs)
			if (includeInput in inputs)
				flags.defineString(includeInput).setDescription(inputs[includeInput] as string);
		flags.parse();

		const runsInfoRes = await getRunsInfoRes((flags.get("browser") || env.BROWSER) as string, resolve(__dirname, (flags.get("testResultsDir") || env.TEST_RESULTS_DIR) as string, (flags.get("outfilePath") || env.OUTFILE_PATH) as string));
		if (runsInfoRes.isErr())
			throw fmtErr("Failed to get the WPT runs info, runsInfoRes.error.message");

		// Write the runs info to the file as per the outfile from the flags or the env
		const writeFileToDirRes = safeWriteFileToDir((flags.get("outfilePath") || env.OUTFILE_PATH) as string, JSON.stringify(runsInfoRes.value));
		if (writeFileToDirRes.isErr())
			throw fmtErr("Failed to write the WPT runs info to the file", writeFileToDirRes.error.message);
		console.info("Successfully wrote the WPT runs info to the file");
	});