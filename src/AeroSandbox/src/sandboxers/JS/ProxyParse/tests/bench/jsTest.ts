/*
import type { ExecException } from "node:child_process"

import { exec } from "node:child_process";
import { promisify } from "node:util";
*/

import { fileURLToPath } from "node:url";
import path from "node:path";
import { access, readFile, writeFile } from "node:fs/promises";

import { glob } from "glob";

import AeroGel from "../../../backends/AeroGel";

import { Bench } from 'tinybench';

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const rootDir = path.resolve(__dirname, "..", "..");
const checkoutsDir = path.resolve(rootDir, "checkouts");
const webkitCheckoutDir = path.resolve(checkoutsDir, "WebKit")
const jsTestsDir = path.resolve(webkitCheckoutDir, "JSTests");

const propTreeAeroGelSpecific = 'window["<proxyNamespace>"]["<ourNamespace>"].rewriters.js.aeroGel.';
const propTree = 'window["<proxyNamespace>"]["<ourNamespace>"].rewriters.js.shared.';

/** [key: rewriterName]: rewriter handler */
const tryRewriters = {
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

const benchmarkName = "JSTest benchmarks";

/**
 * Runs the JS Rewriter on all of the tests that are used in the WebKit browser, processed as one large bundle
 * @param excludeExternalTests Whether to exclude the tests that are imported from other tests written by vendors such as *Mozilla* or independent projects such as *test262*
 * @returns The time it took to process the bundle in milliseconds
 */
export default async function benchJSTest(excludeExternalTests: boolean): void {
    const ignoreExternalTestsList = excludeExternalTests ? [`${jsTestsDir}/mozilla]`, `${jsTestsDir}/test262`] : [];

    const jsFiles = await glob(`${jsTestsDir}/**/*.js`, {
        ignore: [...ignoreExternalTestsList, `${jsTestsDir}/**/*.js.map`]
    });

    let combBundle = "";
    for await (const jsFile of jsFiles) {
        const fileData = await readFile(jsFile, "utf-8");
        combBundle += fileData;
    }

    const bench = new Bench({ name: benchmarkName, time: 100000000, iterations: 0, warmup: false, throws: true });

    for (const [rewriterName, rewriterHandler] of Object.entries(tryRewriters)) {
        let newCombBundle: string;
        bench.add(benchmarkName, () => {
            newCombBundle = rewriterHandler(combBundle);
            /*
            if (newCombBundle) {
                await writeFile(`${rootDir}/newCombBundle.${rewriterName}.js`, newCombBundle);
            }
            */
            //console.log(newCombBundle.length);
        });
    }


    await bench.run();

    console.log(bench.name);
    console.log(bench.table());
}

// TODO: Do the if CLI thing
benchJSTest(false);

// @ts-ignore
/*
async function checkoutJSTestDir() {
    // Run these in the `ProxyParse` directory
    // git clone --filter=blob:none --no-checkout --depth 1 --sparse https://github.com/WebKit/WebKit checkouts/WebKit
    // cd checkouts/WebKit
    // git sparse-checkout add JSTests
    // git checkout

    try {
        try {
            await access(jsTestsDir);
            await safeExec(
                `cd ${ jsTestsDir } && git pull`,
                {
                    cwd: rootDir
                }
            );
        } catch {
            try {
                await access(webkitCheckoutDir)
            } catch {
                setTimeout(async () => {
                    await mkdir(webkitCheckoutDir, { recursive: true });
                    await safeExec(
                        `git clone--filter = blob: none--no - checkout--depth 1 --sparse https://github.com/WebKit/WebKit ${webkitCheckoutDir}`, {
            cwd: rootDir
                    }
    );
}, 5000);
            }
setTimeout(async () => {
    await safeExec(`git sparse-checkout add JSTests`, {
        cwd: rootDir
    });
}, 10000);
setTimeout(async () => {
    await safeExec("git checkout", {
        cwd: rootDir
    });
}, 15000);
            //console.info("All of the commands have been executed successfully!");
        }
        // @ts-ignore
    } catch (err: any) {
    throw new Error(`Failed to execute a command for initializing the JSTests dir: ${err.message}`);
}
}
*/