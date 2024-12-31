import path from "node:path";

import { initAll } from "./buildTools.ts";

import { exec } from "node:child_process";

if ("Deno" in globalThis)
	throw new Error("This script is not intended to be run in Deno!");

// @ts-ignore This file is not intended to be for deno
const liveBuildMode = "LIVE_BUILD" in process.env;
// @ts-ignore This file is not intended to be for deno
let debugMode = liveBuildMode || "DEBUG" in process.env;

const properDirType = debugMode ? "debug" : "prod";
const properDir = path.resolve(__dirname, "dist", properDirType);

initAll(
	{
		dist: path.resolve(__dirname, "dist"),
		proper: properDir
	},
	{
		verboseMode: debugMode,
		// @ts-ignore This is just wrong
		properDirType
	}
).match(
	() => {
		try {
			exec("npm run buildRaw");
		} catch (err) {
			throw new Error(`Failed to run the main build script:\n\t${err.stack.join("\n").join("\n\t")}!`);
		}
	},
	(err: Error) => {
		// @ts-ignore
		throw new Error(`Failed to initialize the dist folder:\n\t${err.stack.join("\n").join("\n\t")}!`);
	}
)