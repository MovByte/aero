import AeroGel from "../../../AeroSandbox/src/sandboxers/JS/backends/AeroGel.js";

import { Bench } from 'tinybench';

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

const benchmarkName = "Bundle benchmarks";

export default async function benchJSTest(excludeExternalTests: boolean): void {
    const bench = new Bench({ name: benchmarkName, time: 1, iterations: 1, warmup: false, throws: true });

    const bundleResp = await fetch("https://discord.com/assets/web.96b4cfe2a5e310ec042c.js");
    const bundle = (await bundleResp.text());

    for (const [rewriterName, rewriterHandler] of Object.entries(tryRewriters)) {
        let newCombBundle: string;
        console.log(rewriterName);
        bench.add(benchmarkName, () => {
                /*newCombBundle = */console.log(rewriterHandler(bundle));
            /*
            if (newCombBundle) {
                await writeFile(`${rootDir}/newCombBundle.${rewriterName}.js`, newCombBundle);
            }
            */
            //console.log(newCombBundle.length);
        });
        bench.add("Discord test baseline iteration (no gen)", () => {
            for (let i = 0; i < bundle.length; i++) {
                const char = bundle[i];
            }
        })
    }

    await bench.run();

    console.log(bench.name);
    console.log(bench.table());
    console.log(bench.results[0].period / 1000)
    console.log(bench.results[1].period / 1000)
}
benchJSTest();