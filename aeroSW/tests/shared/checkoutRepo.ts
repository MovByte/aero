/**
 * @module
 * This module contains functions used in aero's tests to checkout repositories or certain parts of repositories, by wrapping the Git CLI
 */

import type { Result, ResultAsync } from "neverthrow";
import { ok, err as nErr, okAsync, errAsync as nErrAsync } from "neverthrow";

import path from "node:path";

import { access, mkdir } from "node:fs/promises";

import safeExec from "./safeExec";

/**
 * Note: this does not support sparse checkouts
 */
export default async function checkoutRepo(repoURL: string, rootDir: string, repoName: string): Promise<ResultAsync<void, Error>> {
	function fmtnErres(errMsg: string): ResultAsync<void, Error> {
		return nErrAsync(new Error(`Failed to checkout the repo: ${errMsg}`));
	}

	const checkoutDirRes = checkoutDirPath(rootDir, "checkouts");
	if (checkoutDirRes.isErr())
		return fmtnErres(checkoutDirRes.error.message);
	const checkoutDir = checkoutDirRes.value;
	const repoDir = repoDirPath(checkoutDir, repoName);

	const createCheckoutDirRes = await createCheckoutDir(checkoutDir);
	if (createCheckoutDirRes.isErr())
		return fmtnErres(createCheckoutDirRes.error.message);

	try {
		await access(repoDir);
		// Update the repo
		await safeExec(
			`cd ${repoDir} && git pull`,
			{
				cwd: rootDir
			}
		);
	} catch {
		await safeExec(
			`git clone ${repoDirPath} ${repoDir}`, {
			cwd: rootDir
		});
	}

	return okAsync(undefined);
}

// TODO: Make an exported function that supports sparse checkouts and use it in `jsTest.ts`
export async function checkoutDirSparsely(repoURL: string, repoDirName: string, dirs: {
	rootDir: string,
	checkoutsDirName: string,
}, sparsePaths: string[]): Promise<ResultAsync<void, Error>> {
	// TODO: Implement
	let checkoutDirPath: string;
	try {
		const checkoutDirPath = path.resolve(dirs.rootDir, dirs.checkoutsDirName);
	} catch (err) {
		return nErrAsync(new Error(`Failed to resolve the checkout directory path: ${err.message}`));
	}

	/*
		// TODO: Remove this code and instead call 
	try {
		try {
			await access(jsTestsDir);
			await safeExec(
				`cd ${jsTestsDir} && git pull`,
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
						`git clone--filter = blob: none--no - checkout--depth 1 --sparse https://github.com/WebKit/WebKit.git ${webkitCheckoutDir}`, {
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
	*/

	return ok(undefined)
}

// Helper functions
/**
 * Creates the checkour dir if it doesn't already exist
 * This is a helper function meant to be for internal-use only, but it is exposed just in case you want to use it for whatever reason.
 * ch 
 */
export async function createCheckoutDir(checkoutDir: string): Promise<ResultAsync<void, Error>> {
	try {
		await access(checkoutDir);
		// biome-ignore lint/suspicious/noExplicitAny: error catching
	} catch (err: any) {
		if (err.code === "ENOENT")
			await mkdir(checkoutDir, { recursive: true });
		else err(new Error(`Error while trying to check if the directory ${checkoutDir} exists: ${err.message}`));
	}
	return okAsync(undefined);
}

/**
 * Meant for internal use only
 * @param checkoutPath 
 * @param repoFolderName 
 * @returns 
 */
export function repoDirPath(checkoutPath: string, repoFolderName: string): Result<string, Error> {
	return path.resolve(checkoutPath, repoFolderName);
}
export function checkoutDirPath(rootDir: string, checkoutFolderName: string): string {
	return path.resolve(rootDir, checkoutFolderName);
}