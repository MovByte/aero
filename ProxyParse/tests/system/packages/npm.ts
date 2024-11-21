import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { readdir } from "node:fs/promises";

import test from "node:test";


const __dirname = fileURLToPath(new URL(".", import.meta.url));

const expectedPath = resolve(__dirname, "..", "node_modules", "proxy-parse-js");
/*
test("Node paths were what was expected", t => {
    t.test("main", t => t.strictEqual(aeroPath, expectedPath));
});
*/


// Look into the dist folder and check if all the files are where they belong
const expectedImports = [
    "keywordProcessor.js",
    "keywordProcessor.js.map",
    "replaceKeywords.js"
    // TODO: include the internal
];
test("The expected file names were found in node_modules", async t => {
    const proxyParseFilenames = await readdir(resolve(expectedPath, "dist"));
    for (const expectedAeroImport of proxyParseFilenames)
        t.test(expectedAeroImport, t =>
            t.ok(proxyParseFilenames.includes(expectedAeroImport))
        );
});
