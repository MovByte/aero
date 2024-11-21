import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { readdir } from "node:fs/promises";

import { default as aeroPath, aeroExtrasPath } from "aero-proxy";
import { aeroSandboxPath } from "aero-sandbox";

import test from "node:test";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const expectedAeroPath = resolve(__dirname, "..", "node_modules", "aero-proxy");
const expectedAeroExtrasPath = resolve(
	__dirname,
	"..",
	"node_modules",
	"aero-proxy",
	"extras"
);
const expectedAeroSandboxPath = resolve(
	__dirname,
	"..",
	"node_modules",
	"aero-sandbox"
);
test("Node paths were what was expected", t => {
	t.test("aeroPath", t => t.strictEqual(aeroPath, expectedAeroPath));
	t.test("aeroExtrasPath", t =>
		t.strictEqual(aeroExrasPath, expectedAeroExtrasPath)
	);
	t.test("aeroSandboxPath", t =>
		t.strictEqual(aeroSandboxPath, expectedAeroSandboxPath)
	);
});

// Look into the dist folder and check if all the files are where they belong
const expectedAeroSWImports = [
	"sw.js",
	"sw.js.map",
	"defaultConfig.js",
	"logo.webp"
]; // TODO: Finish these
const expectedAeroExtraImports = ["aeroPath.cjs", "aeroPath.js"];
const expectedAeroSandboxImports = [
	"sandbox.js",
	"sandbox.js.map",
	"jsRewriter.js",
	"jsRewriter.js.map",
	"featureFlags.js",
	"featureFlags.js.map",
	"storageIsolation.js",
	"storageIsolation.js.map",
	"ControlView.js",
	"ControlView.js.map",
	"ElectronControlView.js",
	"ElectronControlView.js.map",
	"ElectronWebView.js",
	"ElectronWebView.js.map"
];
test("The expected file names were found in node_modules", async t => {
	t.test("aeroSW", async t => {
		const aeroFilenames = await readdir(`${aeroPath}/sw`);
		for (const expectedAeroImport of expectedAeroSWImports)
			t.test(expectedAeroImport, t =>
				t.ok(aeroFilenames.includes(expectedAeroImport))
			);
	});
	t.test("aeroExtras", async t => {
		const aeroExtraFilenames = await readdir(aeroExtrasPath);
		for (const expectedAeroExtraImport of expectedAeroExtraImports)
			t.test(expectedAeroExtraImport, t =>
				t.ok(aeroExtraFilenames.includes(expectedAeroExtraImport))
			);
	});
	t.test("aeroSandbox", async t => {
		const aeroSandboxFilenames = await readdir(aeroSandboxPath);
		for (const expectedAeroSandboxImport of expectedAeroSandboxImports)
			t.test(expectedAeroSandboxImport, t =>
				t.ok(aeroSandboxFilenames.includes(expectedAeroSandboxImport))
			);
	});
});
