import path from "node:path";

import rspack from "@rspack/core";
import { RsdoctorRspackPlugin } from "@rsdoctor/rspack-plugin";

//import type { FeatureFlagsRspackOptional } from "types/featureFlags";
import createDefaultFeatureFlags from "./createDefaultFeatureFlags";
import featureFlagsBuilder from "./src/AeroSandbox/featureFlagsBuilder";

const liveBuildMode = "LIVE_BUILD" in process.env;
/** This var is enabled by default */
const verboseMode =
	!("VERBOSE" in process.env) || process.env.VERBOSE !== "false";
const debugMode = liveBuildMode || "DEBUG" in process.env;
const serverMode = process.env.SERVER_MODE;

// Scripts
import InitDist from "./scripts/InitDist";

import { Logger } from "./src/AeroSandbox/rspack.config.ts";

import importSync from "import-sync";

// TODO: Type assert with partial
let featureFlagOverrides = {};
try {
	featureFlagOverrides = importSync("./createFeatureFlags.ts").default;
} catch (_err) {
	console.warn(
		"⚠️ Unable to find any feature flag overrides. Is this intentional?"
	);
}

const featureFlags = createDefaultFeatureFlags({
	...featureFlagOverrides,
	debugMode
});

if (serverMode) {
	// @ts-ignore
	featureFlags.reqInterceptionCatchAll = JSON.stringify("referrer");
	if (serverMode === "winterjs")
		// @ts-ignore
		featureFlags.serverOnly = JSON.stringify("winterjs");
	else if (serverMode === JSON.stringify("cf-workers"))
		// @ts-ignore
		featureFlags.serverOnly = JSON.stringify("cf-workers");
	// @ts-ignore
} else {
	// @ts-ignore
	featureFlags.reqInterceptionCatchAll = JSON.stringify("clients");
	// @ts-ignore
	featureFlags.serverOnly = JSON.stringify(false);
}

const logger = new Logger(verboseMode);

logger.log("The chosen feature flags are:");
logger.log(featureFlags);

// biome-ignore lint/suspicious/noExplicitAny: I don't know the exact type to use for this at the moment
const plugins: any = [
	// @ts-ignore
	new rspack.DefinePlugin(featureFlagsBuilder(featureFlags))
];

if (debugMode)
	plugins.push(
		// There are currently a bug with Rsdoctor where the option `disableClientServer` doesn't work. You must launch the bundle analyzer through the cli instead.
		new RsdoctorRspackPlugin({
			//port: 3300,
			// Do not pop up every time (annoying)
			disableClientServer: liveBuildMode,
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
const properDir = path.resolve(__dirname, "dist", properDirType, "sw");

logger.log(`Building in ${properDirType} mode`);
if (liveBuildMode) logger.log("Building in live build mode");

//const sourceMapType = debugMode ? "eval-source-map" : "source-map";

const config: rspack.Configuration = {
	mode: debugMode ? "development" : "production",
	//devtool: sourceMapType,
	entry: {
		sw: path.resolve(__dirname, "./src/this/handleSW.ts")
		// Building these bundles separately allows for the user to roll out their own config files without having to build aero as a whole
	},
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
				loader: "builtin:swc-loader"
			}
		]
	},
	output: {
		filename: "[name].js",
		path: properDir,
		iife: true,
		libraryTarget: "es2022"
	},
	target: ["webworker", "es2022"]
};

if (debugMode) config.watch = true;

new InitDist(
	{
		dist: path.resolve(__dirname, "dist"),
		proper: properDir,
		sw: path.resolve(__dirname, "dist", properDirType, "sw")
	},
	properDirType,
	verboseMode
);

export default config;
