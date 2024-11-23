// This is already defined in the global scope of Node, but not for Deno
import process from "node:process";

import { access, copyFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";

// Rust-like error handling
import { Result, ok, err as err, fromPromise } from 'neverthrow';

/**
 * This interface defines the directories that will be used by the `InitDist` class
 */
interface Dirs {
	dist: string;
	proper: string;
}

/**
 * This class initializes everything in the build folder to prepare for Rspack to build into there
 * @example
 * ...
 * const verboseMode = !("VERBOSE" in process.env) || process.env.VERBOSE !== "false";
 * ...
 * const properDirType = debugMode ? "debug" : "prod";
 * 
 * const initDist = new InitDist(
 * 	{
 * 		dist: path.resolve(__dirname, "dist"),
 * 		proper: path.resolve(__dirname, "dist", properDirType),
 * 		sw: path.resolve(__dirname, "dist", properDirType, "sw")
 * 	}, 
 * 	properDirType,
 * 	verboseMode
 * );
 */
export default class InitDist {
	distDir: string;
	properDir: string;
	properDirType: string;
	logStatus: boolean;

	constructor(dirs: Dirs, properDirType: string, logStatus: boolean) {
		this.distDir = dirs.dist;
		this.properDir = dirs.proper;
		this.properDirType = properDirType;
		this.logStatus = logStatus;
	}

	async init(): Promise<Result<void, Error>> {
		if (this.logStatus) console.info("Initializing the dist folder");

		// @ts-ignore We know this is an error type
		const accessResult = await fromPromise(access(this.distDir));
		if (accessResult.isErr())
			// We expect this to error and it is fine if it does. We are merely doing this to check if the folder exists.
			return this.createDistDir();
		return this.initProperDir();
	}

	async createDistDir(): Promise<Result<void, Error>> {
		if (this.logStatus) console.info("Creating the dist folder");

		// @ts-ignore We know this is an error type
		const mkdirRes = await fromPromise(mkdir(this.distDir), (err: Error) => new Error(`Failed to create dist directory: ${err.message}`));
		if (mkdirRes.isErr())
			return err(mkdirRes.error);
		return this.initProperDir();
	}

	async initProperDir(): Promise<Result<void, Error>> {
		if (this.logStatus)
			console.info("Initializing the proper folder (...dist/<debug/prod>)");

		// @ts-ignore We know this is an error type
		const accessResult = await fromPromise(access(this.properDir));
		if (accessResult.isErr())
			// We expect this to error and it is fine if it does. We are merely doing this to check if the folder exists.
			return this.createProperDir();

		// @ts-ignore We know this is an error type
		const rmRes = await fromPromise(rm(this.properDir, { recursive: true }), (err: Error) => new Error(`Failed to remove proper folder: ${err.message}`));
		if (rmRes.isErr())
			// Travel the error up the chain to eventually be handled by whomever called `init`
			return err(rmRes.error);

		return this.createProperDir();
	}

	async createProperDir(): Promise<Result<void, Error>> {
		if (this.logStatus) console.info("Creating the proper folder");

		// @ts-ignore We know this is an error type
		const mkdirRes = await fromPromise(mkdir(this.properDir), (err: Error) => new Error(`Failed to create proper folder: ${err.message}`));
		if (mkdirRes.isErr())
			// Travel the error up the chain to eventually be handled by whomever called `init`
			return err(mkdirRes.error);
		return this.createDistBuild();
	}

	async createDistBuild(): Promise<Result<void, Error>> {
		if (this.logStatus)
			console.info("Copying over the default config to the dist folder");

		// @ts-ignore We know this is an error type
		const copyRes = await fromPromise(copyFile(path.resolve(__dirname, "src/defaultConfig.js"), path.resolve(__dirname, `dist/${this.properDirType}/defaultConfig.js`)), (err: Error) => new Error(`Failed to copy the default config: ${err.message}`));
		if (copyRes.isErr())
			// Travel the error up the chain to eventually be handled by whomever called `init`
			return err(copyRes.error);

		console.info("Default config copied successfully");
		return ok(undefined);
	}
}

// If the file is being run as a CLI script
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
	const properDirType = "DEBUG" in process.env ? "debug" : "prod";

	const initDist = new InitDist(
		{
			dist: path.resolve(__dirname, "..", "dist"),
			proper: path.resolve(__dirname, "dist", properDirType),
		},
		properDirType,
		true
	);

	(await initDist.init()).match(
		() => console.info("Successfully the globals for TS"),
		(err) => console.error(`Unable to initialize the globals for TS: ${err.message}`)
	);
}
