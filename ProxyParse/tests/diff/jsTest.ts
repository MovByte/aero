/**
 * @module
 * This is a test and benchmark that runs the JS Rewriter on all of the tests that are used in the WebKit browser, processed as one large bundle.
 * This module is exposed as a CLI.
 * The CLI here is used for a GitHub Action, which will be published on the GitHub Marketplace.
 * In addition, this module will be published on NPM and JSR.
 */
// TODO: Make a GitHub Action that runs this script and logs the results to a CSV file

import type { ResultAsync } from "neverthrow";
import { okAsync, errAsync as nErrAsync } from "neverthrow";

import * as flags from "flags";
// @ts-ignore: This package is installed
import { envSafe, string, url } from "envSafe";

import { fileURLToPath } from "node:url";
import path from "node:path";
import { readFile, writeFile, mkdir } from "node:fs/promises";

import { glob } from "glob";

// @ts-ignore: This package is installed
import { Bench } from "tinybench";
import validateTestBenchCSV from "../../../tests/shared/validateCSV.js";

import { checkoutDirSparsely } from "../../../tests/shared/checkoutRepo.js";

/**
 * The context to checkout JSTest
 * This is exposed if you need it
 */
export interface JSTestEnvContext {
	/** The URL to your web proxy */
	proxyURL: string,
	/** The URL to a git repo of *WebKit* */
	webkitRepo: string,
	/** The directory name of what is cloned inside of the `checkoutsDir` */
	webkitDir: string,
	/** The root directory of the project which contains the `checkoutsDir` */
	rootDir: string,
	/** The directory inside of root that is where the checkouts occur in the test */
	checkoutsDir: string
}

/**
 * Runs the JS Rewriter on all of the tests that are used in the WebKit browser, processed as one large bundle.
 * You must call `checkoutJSTestDir` before running this function
 * @param excludeExternalTests Whether to exclude the tests that are imported from other tests written by vendors such as *Mozilla* or independent projects such as *test262*
 * @returns The test bench results wrapped behind a `ResultAsync` object from *Neverthrow*
 */
export async function benchJSTest(jsTestEnvContext: JSTestEnvContext, excludeExternalTests: boolean, tryRewriters: any, benchmarkName = "JSTest Benchmarks"): Promise<ResultAsync<Bench, Error>> {
	if (!excludeExternalTests)
		benchmarkName += " (including external tests)";

	const ignoreExternalTestsList = excludeExternalTests ? [`${jsTestEnvContext.webkitDir}/mozilla]`, `${jsTestEnvContext.webkitDir}/test262`] : [];

	let jsFiles: string[];
	try {
		jsFiles = await glob(`${jsTestEnvContext.webkitDir}/**/*.js`, {
			ignore: [...ignoreExternalTestsList, `${jsTestEnvContext.webkitDir}/**/*.js.map`]
		});
	} catch (err: any) {
		return nErrAsync(new Error(`Failed to glob the files from JSTest (perhaps the checkout failed?): ${err.message}`));
	}

	let combBundle = "";
	for await (const jsFile of jsFiles) {
		try {
			const fileData = await readFile(jsFile, "utf-8");
			combBundle += fileData;
		} catch (err: any) {
			return nErrAsync(new Error(`Failed to retrieve a file from the glob": ${err.message}`));
		}
	}

	let bench: Bench;
	try {
		bench = new Bench({ name: benchmarkName, warmup: false, throws: true });
		for (const [rewriterName, rewriterHandler] of Object.entries(tryRewriters)) {
			let newCombBundle: string;
			bench.add(benchmarkName, async () => {
				// @ts-ignore
				newCombBundle = await rewriterHandler(combBundle);
				if (newCombBundle) {
					await writeFile(`${rootDir}/newCombBundle.${rewriterName}.js`, newCombBundle);
				}
			});
		}
	} catch (err: any) {
		return nErrAsync(new Error(`Failed to initialize the test bench: ${err.message}`));
	}
	try {
		await bench.run();
	} catch (err: any) {
		return nErrAsync(new Error(`Failed to run the test bench: ${err.message}`));
	}

	return okAsync(bench);
}

/**
 * Processes the JSTest Benchmark Results into a CSV file.
 * The CSV is of this header: `jsRewriterName,passed,totalTime,mean,median,min,max`
 * @param bench The Bench to be used to get the benchmark results from
 * @returns The CSV wrapped behind a `ResultAsync` object from *Neverthrow*
 */
export async function processJSTestBenchToCSV(bench: Bench, strictValidate = true, verbose = true): Promise<ResultAsync<string, Error>> {
	// Process the bench results into a CSV
	let csvOut = "jsRewriterName,passed,totalTime,mean,median,min,max\n";
	for (const result of bench.results)
		csvOut += `${result.name},true,${result.totalTime},${result.mean},${result.median},${result.min},${result.max}\n`;

	// Strictly validate the CSV
	if (strictValidate) {
		// @ts-ignore: No, it should only expect one key
		const validateTestBenchCSVRes = validateTestBenchCSV(csvOut, "js", Object.keys(tryRewritersAero));
		if (validateTestBenchCSVRes.isErr())
			return nErrAsync(new Error(`The validation CSV of the csv failed: ${validateTestBenchCSVRes.error}${verbose ? `\nThe CSV in question is: ${csvOut}` : ""}`));
	}

	return okAsync(csvOut)
}

/**
 * This is a stub
 */
// TODO: Use this in the GitHub Action
export default async function testJSTest(excludeExternalTests: boolean): Promise<ResultAsync<void, Error>> {
	// TODO: Add the arguments to allow you to provide
	// TODO: Patch the CLI to run JSTest to make it run inside of a proxy context and compare the results with and without the proxy like I do on WPT-diff and publish that as a GitHub Action on the GitHub Marketplace as well
	return nErrAsync(new Error("This is a stub!"));
}

// @ts-ignore
/**
 * Checks out the JSTests directory from the WebKit repository using the `git` CLI
 * This is a helper function meant to be for internal-use only, but it is exposed just in case you want to use it for whatever reason.
 * @param jsTestEnvContext The context required to checkout JSTest
 */
export async function checkoutJSTestDir(jsTestEnvContext: JSTestEnvContext): Promise<ResultAsync<void, Error>> {
	const checkoutSpareRepoRes = await checkoutDirSparsely(jsTestEnvContext.webkitRepo, jsTestEnvContext.webkitDir, {
		rootDir: jsTestEnvContext.rootDir,
		checkoutsDir: jsTestEnvContext.checkoutsDir,
	}, ["JSTests"])
	if (checkoutSpareRepoRes.isErr())
		return nErrAsync(new Error(`Failed to execute a command for initializing the JSTests dir: ${checkoutSpareRepoRes.error.message} `));
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
		import.meta.url === `file://${process.argv[1]}`;
if (isCLI) {
	(async () => {
		// @ts-ignore: This is a module script
		const __dirname = fileURLToPath(new URL(".", import.meta.url));

		flags.defineString("proxyURL").setDescription("The URL to your web proxy");
		flags.defineString("webkitRepo").setDescription("The URL to a git repo of WebKit");
		flags.defineString("webkitDir").setDescription("The directory name that WebKit will be cloned to in your checkouts directory");
		flags.defineString("checkoutsDir").setDescription("The directory name that WebKit will be cloned to in your checkouts directory");
		flags.defineString("jsDiffTestDataPath").setDescription("The path to your JS-Diff test data bundle (required to try the JS Rewriters)");
		flags.defineString("outputCSV", "false", "The path to output the CSV file to. If this is ommited, the CSV will be outputted to the console.");
		flags.parse();

		const rootDir = path.resolve(__dirname, "..", "..");
		const env = envSafe({
			PROXY_URL: url({
				devDefault: "http://localhost:2525/go/"
			}),
			WEBKIT_REPO: url({
				devDefault: "https://github.com/WebKit/WebKit.git"
			}),
			WEBKIT_DIR: string({
				devDefault: "WebKit"
			}),
			ROOT_DIR: string({
				devDefault: rootDir
			}),
			CHECKOUTS_DIR: string({
				devDefault: path.resolve(rootDir, "checkouts")
			}),
			JSDIFF_TEST_DATA_PATH: string({
				devDefault: path.resolve(__dirname, "../../../../../../../build/jsDiffTestData.js")
			})
		});

		const testDataPath = flags.get("jsDiffTestDataPath") || env.JSDIFF_TEST_DATA_PATH;
		// @ts-ignore: I haven't yet made a type for this
		let tryRewritersAero: any;
		try {
			const testData = import(testDataPath);
			// @ts-ignore
			tryRewritersAero = testData.default;
		} catch (err) {
			throw new Error(`Invalid test data path, ${testDataPath}, for JS-diff: ${err}`)
		}

		const benchRes = await benchJSTest({
			proxyURL: flags.get("proxyURL") || env.PROXY_URL,
			webkitRepo: flags.get("webkitRepo") || env.WEBKIT_REPO,
			webkitDir: flags.get("webkitDir") || env.WEBKIT_DIR,
			rootDir: flags.get("rootDir") || env.ROOT_DIR,
			checkoutsDir: flags.get("checkoutsDir") || env.CHECKOUTS_DIR
		}, true, tryRewritersAero);
		if (benchRes.isErr())
			throw new Error(`Failed to run the JSTest benchmarks for the CLI: ${benchRes.error.message} `);
		const bench = benchRes.value;

		const outputCSV = flags.get("outputCSV");
		if (typeof outputCSV === "string" || outputCSV !== "false") {
			const csvRes = await processJSTestBenchToCSV(bench);
			if (csvRes.isErr())
				throw new Error(`Failed to process the JSTest Benchmarks into a CSV for the CLI: ${csvRes.error.message}`);
			try {
				// @ts-ignore: `outputCSV` has already been checked to be a `string` type
				writeFile(path.join(rootDir, outputCSV), csvRes.value, "utf-8");
			} catch (err) {
				throw new Error(`Failed to write the CSV to the file system: ${err}\nThe CSV was: ${csvRes.value}`);
			}
		} else {
			console.log(bench.name);
			console.log(bench.table());
		}
	});
}