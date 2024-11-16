import path from "node:path";

import rspack from "@rspack/core";
import { RsdoctorRspackPlugin } from "@rsdoctor/rspack-plugin";

import Logger from "./build/Logger";

const liveBuildMode = "LIVE_BUILD" in process.env;
let debugMode = liveBuildMode || "DEBUG" in process.env;
/** This var is enabled by default */
const verboseMode =
	!("VERBOSE" in process.env) || process.env.VERBOSE !== "false";
/** Build AeroSandbox without the extra APIs. This should be used when building just for the proxy only; **/
const minimalBuild = true || "BUILD_MINIMAL" in process.env;
const minimalSharedBuild = "BUILD_SHARED_MINIMAL" in process.env;
/** Makes independent build files for each module that will be tested in the unit testing **/
const testBuild = "TEST_BUILD" in process.env;
if (!debugMode && testBuild) debugMode = true;

// This is the most important env variable
const buildConfigPath = "BUILD_CONFIG_PATH" in process.env;
if (!buildConfigPath) {
	throw new Error(
		"Fatal: BUILD_CONFIG_PATH env variable not set. Don't know what to build for!"
	);
}

import type { createFeatureFlags } from "./build/featureFlags.ts";
import createDefaultFeatureFlags from "./createDefaultFeatureFlags";

import initAll from "./build/initAll";

import featureFlagsBuilder from "./featureFlagsBuilder";

// TODO: Type assert with partial
/**
 * Will contain the user's overrides for the default feature flags config
 * You can modify this by defining `creatureFeatureFlags.ts`.
 * This has no effect without defining the file.
 * You create it like:
 * @example
 * import type { FeatureFlags } from "./build/featureFlags.ts";
 *
 * export default (ctx: CtxType) => {...} as Partial<FeatureFlags>;
 */
/**
 * The user-defined overrides for the default feature flags config.
 * It is set to Partial because we will set it later when `createFeatureFlags.ts` is imported. */
let featureFlagOverrides: Partial<createFeatureFlags> = {};
try {
	featureFlagOverrides = importSync("./createFeatureFlags.ts").default;
} catch (_err) {
	console.warn(
		"⚠️ Unable to find any feature flag overrides. Is this intentional?"
	);
}

/** The feature flags to be used in the build config */
const featureFlags = createDefaultFeatureFlags({
	...featureFlagOverrides,
	debugMode
});

/** The plugins to be used in the build config */
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const plugins: any[] = [
	new rspack.DefinePlugin(featureFlagsBuilder(featureFlags)),
	new rspack.DefinePlugin({
		BUILD_CONFIG_PATH: JSON.stringify(buildConfigPath)
	})
];


const logger = new Logger(verboseMode);

logger.log("The chosen feature flags are:");
logger.log(featureFlags);

if (debugMode) {
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
}

const properDirType = debugMode ? "debug" : "prod";
const properDir = path.resolve(__dirname, "dist", properDirType);

logger.log(
	`\nBuilding in ${properDirType === "prod" ? "production" : "debug"} mode`
);
if (liveBuildMode) logger.log("Building in live build mode");

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
	featureFlags: "./src/featureFlags.ts",
	swAdditions: "./src/swAdditions.ts",
	init$aero: "./src/init$aero.ts",
	end$aero: "./src/end$aero.ts"
};

const config: rspack.Configuration = {
	mode: debugMode ? "development" : "production",
	optimization: {
		chunkIds: "named"
	},
	entry: genEntryFiles(
		testBuild
			? {
				// API Interceptors for the Script Sandbox
				location: "./src/interceptors/loc/location.ts",
				scriptSandbox:
					"./src/interceptors/concealer/misc/scriptSandboxing.ts",
				// Libs for the API Interceptors
				loggers: "./src/shared/Loggers.ts",
				replaceProxyNamespace: "./build/replaceProxyNamespace.ts",
				// The JS rewriter
				jsRewriter: "./src/sandboxers/JS/JSRewriter.ts",
				jsDiffTestData: "./src/sandboxers/JS/ProxyParse/tests/shared/testData.ts"
			}
			: minimalBuild
				? {
					...defaultBuild,
					// Extra APIs
					storageIsolation:
						"./src/apis/StorageIsolator/storageIsolation.ts",
					ControlView: "./src/apis/CustomViews/ControlView.ts",
					ElectronControlView:
						"./src/apis/CustomViews/ElectronControlView.ts",
					ElectronWebView:
						"./src/apis/CustomViews/ElectronWebView.ts"
				}
				: defaultBuild
	),
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
	// FIXME:
	if (minimalSharedBuild) {
		const modulesSharedWithSW = globSync(`${__dirname}/src/shared/*.ts`)
		return [...entryFiles, ...modulesSharedWithSW];
	}
	*/
	return entryFiles;
}

if (debugMode) config.watch = true;

// TODO: Import and use this in the Rspack config for aero

export default config;
