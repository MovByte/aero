import path from "node:path";
import { access, rm, mkdir, copyFile } from "node:fs/promises";

import { globSync } from "glob";

import rspack from "@rspack/core";
import { RsdoctorRspackPlugin } from "@rsdoctor/rspack-plugin";

const liveBuildMode = "LIVE_BUILD" in process.env; // Live debugging
let debugMode = liveBuildMode || "DEBUG" in process.env;
const minimalBuild = true || "BUILD_MINIMAL" in process.env; // Build AeroSandbox without the extra APIs. This should be used when building just for the proxy only;
const minimalSharedBuild = true || "BUILD_SHARED_MINIMAL" in process.env;
const testBuild = "TEST_BUILD" in process.env; // Makes independent build files for each module that will be tested in the unit testing
if (!debugMode && testBuild) debugMode = true;

import createFeatureFlags from "./createFeatureFlags";

const featureFlags = createFeatureFlags({ debugMode });

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const plugins: any[] = [
	// @ts-ignore
	new rspack.DefinePlugin(featureFlags)
];

console.log("The chosen feature flags are:")
console.log(featureFlags);

if (debugMode)
	plugins.push(
		// There are currently a bug with Rsdoctor where the option `disableClientServer` doesn't work. You must launch the bundle analyzer through the cli instead.
		new RsdoctorRspackPlugin({
			//port: 3301,
			// Do not pop up every time in a live build watcher scenario (annoying)
			disableClientServer: true,
			linter: {
				rules: {
					// Don't warn about using non ES5 features
					"ecma-version-check": "off"
				}
			},
			supports: {
				generateTileGraph: true
			}
		})
	);

const properDirType = debugMode ? "debug" : "prod";
const properDir = path.resolve(__dirname, "dist", properDirType);

console.log(`\nBuilding in ${properDirType} mode`);
if (liveBuildMode) console.log("Building in live build mode");

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const output: any = {
	filename: "[name].js",
	path: testBuild ? path.resolve(__dirname, "../../tests/aero") : properDir,
	clean: false
};

if (testBuild) output.library = ["Mod", "[name]"];

const defaultBuild = {
	sandbox: "./build/init.ts",
	jsRewriter: "./src/sandboxers/JS/JSRewriter.ts",
	swAdditions: "./src/swAdditions.ts"
};

const config = {
	mode: debugMode ? "development" : "production",
	optimization: {
		chunkIds: "named",
	},
	entry: genEntryFiles(testBuild
		? {
				// API Interceptors for the Script Sandbox
				location: "./src/interceptors/loc/location.ts",
				scriptSandbox:
					"./src/interceptors/concealer/misc/scriptSandboxing.ts",
				// Libs for the API Interceptors
				loggers: "./src/shared/Loggers.ts",
				replaceProxyNamespace: "./build/replaceProxyNamespace.ts",
				// The JS rewriter
				jsRewriter: "./src/sandboxers/JS/JSRewriter.ts"
			}
		: minimalBuild
			? {
					...defaultBuild,
					// Extra APIs
					storageIsolation:
						"./src/apis/StorageIsolator/storageIsolator.ts",
					ControlView: "./src/apis/CustomViews/ControlView.ts",
					ElectronControlView:
						"./src/apis/CustomViews/ElectronControlView.ts",
					ElectronWebView: "./src/apis/CustomViews/ElectronWebView.ts"
				}
			: defaultBuild),
	plugins,
	resolve: {
		extensions: [".ts"],
		tsConfig: path.resolve(__dirname, "./tsconfig.json")
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				exclude: [/[\\/]node_modules[\\/]/],
				use: [
					{
						loader: "builtin:swc-loader"
					}
				]
			}
		]
	},
	output
};

/**
 * The purpose of this function is to add on to the entry files provided in the argument but also to define separate bundles for all of the code shared with the SW. This function does nothing in debug mode.
 */
function genEntryFiles(entryFiles) {
	/*
	if (minimalSharedBuild) {
		const modulesSharedWithSW = globSync(`${__dirname}/src/shared/*.ts`)
		return [...entryFiles, ...modulesSharedWithSW];
	}
	*/
	return entryFiles;
}


const distDir = path.resolve(__dirname, "dist");
initDist();
function initDist() {
	console.info("Initializing the dist folder")
	access(distDir)
		.then(initProperDir)
		// If dir doesn't exist
		.catch(createDistDir);
}
function createDistDir() {
	console.info("Creating the dist folder")
	mkdir(distDir).then(initProperDir);
}
function initProperDir() {
	console.info("Initializing the proper folder (...dist/<debug/prod>)")
	access(properDir)
		.then(() => {
			rm(properDir, {
				recursive: true
			}).then(createProperDir);
		})
		// If dir doesn't exist
		.catch(createProperDir);
}
function createProperDir() {
	console.info("Creating the proper folder")
	mkdir(properDir).then(createDistBuild);
}
function createDistBuild() {
	console.log("Copying over the default config to the dist folder")
	copyFile(
		path.resolve(__dirname, "src/defaultConfig.js"),
		path.resolve(__dirname, `dist/${properDirType}/defaultConfig.js`)
	);
}

export default config;