/**
 * @module
 * This is a test and benchmark that runs the JS Rewriter on all of the tests that are used in the WebKit browser, processed as one large bundle.
 * This module will be used internally for a GitHub Action, which will be published on the GitHub Marketplace.
 * In addition, this module will be published on NPM and JSR.
 */
// TODO: Make a GitHub Action that runs this script and logs the results to a CSV file

import type { ResultAsync } from "neverthrow";
import { okAsync, errAsync as errrAsync } from "neverthrow";

import { envSafe, string, url } from "envSafe";

import { fileURLToPath } from "node:url";
import path from "node:path";
import { readFile, writeFile, mkdir } from "node:fs/promises";

import { glob } from "glob";

import safeExec from "../../../../../../../../tests/shared/safeExec";

import AeroGel from "../../../backends/AeroGel";

import { Bench } from "tinybench";

import checkoutDirSparsely from "../../../../../../../../tests/shared/checkoutRepo";
import { ok } from "node:assert";

/**
 * The context to checkout JSTest
 * This is exposed if you need it
 */
export interface JSTestEnvContext {
	proxyURL: string,
	webkitRepo: string,
	webkitDir: string
}

/**
 * Detect if the script is being ran as a CLI script and not as a module
 */
const isCLI =
	// For Deno
	globalThis.Deno ? import.meta.main :
		// For Node
		// @ts-ignore: This is a NodeJS-only feature
		require.main === module;

// aero defaults
const env = envSafe({
	PROXY_URL: url({
		devDefault: "http://localhost:2525/go/"
	}),
	WEBKIT_REPO: url({
		devDefault: "https://github.com/WebKit/WebKit.git"
	}),
	WEBKIT_DIR: string({
		devDefault: "WebKit"
	})
});
const propTreeAeroGelSpecific = 'window["<proxyNamespace>"]["<ourNamespace>"].rewriters.js.aeroGel.';
const propTree = 'window["<proxyNamespace>"]["<ourNamespace>"].rewriters.js.shared.';
/** [key: rewriterName]: rewriter handler */
const tryRewritersAero = {
	AeroGel: (new (AeroGel.default)({
		aeroGelConfig: {
			propTrees: {
				fakeLet: propTreeAeroGelSpecific + "fakeLet",
				fakeConst: propTreeAeroGelSpecific + "fakeConst",
			},
			proxified: {
				evalFunc: propTree + "proxifiedEval",
				location: propTree + "proxifiedLocation"
			},
			checkFunc: propTree + "checkFunc"
		},
		keywordGenConfig: {
			supportStrings: true,
			supportTemplateLiterals: true,
			supportRegex: true,
		},
		trackers: {
			blockDepth: true,
			propertyChain: true,
			proxyApply: true
		}
	})).jailScript
	// TODO: Add AeroJet
}

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const rootDir = path.resolve(__dirname, "..", "..");
const checkoutsDir = path.resolve(rootDir, "checkouts");
/**
 * Runs the JS Rewriter on all of the tests that are used in the WebKit browser, processed as one large bundle.
 * You must call `checkoutJSTestDir` before running this function
 * @param excludeExternalTests Whether to exclude the tests that are imported from other tests written by vendors such as *Mozilla* or independent projects such as *test262*
 * @returns The test bench results wrapped behind a `ResultAsync` object from *Neverthrow*
 */
export async function benchJSTest(jsTestEnvContext: JSTestEnvContext, excludeExternalTests: boolean, tryRewriters: any, benchmarkName = "JSTest Benchmarks"): Promise<ResultAsync<Bench, Error>> {
	if (!excludeExternalTests)
		benchmarkName += " (including external tests)";

	// TODO: Catch possible exceptions for unsafe actions and return the errors accordingly with `Neverthrow`

	const ignoreExternalTestsList = excludeExternalTests ? [`${jsTestEnvContext.webkitDir}/mozilla]`, `${jsTestEnvContext.webkitDir}/test262`] : [];

	let jsFiles: string[];
	try {
		jsFiles = await glob(`${jsTestEnvContext.webkitDir}/**/*.js`, {
			ignore: [...ignoreExternalTestsList, `${jsTestEnvContext.webkitDir}/**/*.js.map`]
		});
	} catch (err: any) {
		return errrAsync(new Error(`Failed to glob the files from JSTest (perhaps the checkout failed?): ${err.message}`));
	}

	let combBundle = "";
	for await (const jsFile of jsFiles) {
		try {
			const fileData = await readFile(jsFile, "utf-8");
			combBundle += fileData;
		} catch (err: any) {
			return errrAsync(new Error(`Failed to retrieve a file from the glob": ${err.message}`));
		}
	}

	let bench: Bench;
	try {
		bench = new Bench({ name: benchmarkName, warmup: false, throws: true });
		for (const [rewriterName, rewriterHandler] of Object.entries(tryRewriters)) {
			let newCombBundle: string;
			bench.add(benchmarkName, async () => {
				newCombBundle = await rewriterHandler(combBundle);
				if (newCombBundle) {
					await writeFile(`${rootDir}/newCombBundle.${rewriterName}.js`, newCombBundle);
				}
			});
		}
	} catch (err: any) {
		return errrAsync(new Error(`Failed to initialize the test bench: ${err.message}`));
	}
	try {
		await bench.run();
	} catch (err: any) {
		return errrAsync(new Error(`Failed to run the test bench: ${err.message}`));
	}

	return okAsync(bench);
}

/**
 * This is a stub
 */
export async function processJSTestBenchToCSV(): Promise<ResultAsync<void, Error>> {
	// TODO: Implement and use this in the GitHub Action
	return okAsync(undefined);
}

export default async function testJSTest(excludeExternalTests: boolean): Promise<ResultAsync<void, Error>> {
	// TODO: Add the arguments to allow you to provide
	// TODO: Patch the CLI to run JSTest to make it run inside of a proxy context and compare the results with and without the proxy like I do on WPT-diff and publish that as a GitHub Action on the GitHub Marketplace as well

	return okAsync(undefined);
}

// @ts-ignore
/**
 * Checks out the JSTests directory from the WebKit repository using the `git` CLI
 * This is a helper function meant to be for internal-use only, but it is exposed just in case you want to use it for whatever reason.
 */
export async function checkoutJSTestDir(): Promise<ResultAsync<void, Error>> {
	const checkoutSpareRepoRes = await checkoutDirSparsely(env.WEBKIT_REPO, env.WEBKIT_DIR, {
		rootDir,
		checkoutsDir
	}, ["JSTests"])
	if (checkoutSpareRepoRes.isErr())
		return errrAsync(new Error(`Failed to execute a command for initializing the JSTests dir: ${checkoutSpareRepoRes.error.message}`));
	return okAsync(undefined);
}

if (isCLI) {
	(async () => {
		// TODO: Allow CLI flags to be used as an alternative to ENV Vars
		const benchRes = await benchJSTest({
			proxyURL: env.PROXY_URL,
			webkitRepo: env.WEBKIT_REPO,
			webkitDir: env.WEBKIT_DIR
		}, true, tryRewritersAero);
		if (benchRes.isErr())
			throw new Error(`Failed to run the JSTest benchmarks for the CLI: ${benchRes.error.message}`);
		const bench = benchRes.value;
		// TODO: Add separate subcommands for benchmarking and testing
		console.log(bench.name);
		console.log(bench.table())
	});
}