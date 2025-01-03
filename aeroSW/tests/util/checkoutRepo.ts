/**
 * @module
 * This module contains functions used in aero's tests to checkout repositories or certain parts of repositories, by wrapping the Git CLI
 */

import type { Result, ResultAsync } from "neverthrow";
import { okAsync as nOkAsync, errAsync as nErrAsync } from "neverthrow";
import { fmtErr } from "../util/fmtErrTest.ts";

import path from "node:path";

import { access, mkdir } from "node:fs/promises";

// Utility
import safeExec from "./safeExec";

/**
 * Checks out a repository to the specified directory
 * @param repoURL The URL of the repository to checkout
 * @param rootDir The root directory to checkout the repository in
 * @param repoName The name of the folder to checkout the repository in
 */
export default async function checkoutRepo(repoURL: string, rootDir: string, repoName: string): Promise<ResultAsync<void, Error>> {
	const checkoutDirRes = checkoutDirPath(rootDir, "checkouts");
	if (checkoutDirRes.isErr())
		return fmtCheckoutErrRes(checkoutDirRes.error);
	const checkoutDir = checkoutDirRes.value;
	const repoDir = repoDirPath(checkoutDir, repoName);

	const createCheckoutDirRes = await createCheckoutDir(checkoutDir);
	if (createCheckoutDirRes.isErr())
		return fmtCheckoutErrRes(createCheckoutDirRes.error);

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

	return nOkAsync(undefined);
}

export async function checkoutDirSparsely(repoURL: string, repoDirName: string, dirs: { rootDir: string; checkoutsDirName: string }, sparsePaths: string[]): Promise<ResultAsync<void, Error>> {
	let checkoutDirPath: string;

	try {
		checkoutDirPath = path.resolve(dirs.rootDir, dirs.checkoutsDirName);
	} catch (err) {
		return nErrAsync(new Error(`Failed to resolve the checkout directory path: ${err instanceof Error ? err.message : 'Unknown error'}`));
	}

	try {
		await access(checkoutDirPath);
	} catch {
		await mkdir(checkoutDirPath, { recursive: true });
	}

	try {
		await safeExec(`git clone --filter=blob:none --no-checkout --depth 1 --sparse ${repoURL} ${repoDirName}`, { cwd: dirs.rootDir });
		const repoCwdOption = { cwd: path.resolve(dirs.rootDir, repoDirName) };
		await safeExec(`git sparse-checkout set ${sparsePaths.join(' ')}`, repoCwdOption);
		await safeExec(`git sparse-checkout add JSTests`, repoCwdOption);
		await safeExec("git checkout", repoCwdOption);
	} catch (err) {
		return nErrAsync(new Error(`Failed to execute commands for sparse checkout: ${err instanceof Error ? err.message : 'Unknown error'}`));
	}

	return nOkAsync(undefined);
}

/**
 * Creates the checkout dir if it doesn't already exist.
 * This is a helper function meant to be for internal use only, but it is exposed just in case you want to use it for whatever reason.
 */
export async function createCheckoutDir(checkoutDir: string): Promise<ResultAsync<void, Error>> {
	try {
		await access(checkoutDir);
	} catch (err) {
		if ((err as NodeJS.ErrnoException).code === "ENOENT") {
			try {
				await mkdir(checkoutDir, { recursive: true });
			} catch (mkdirErr) {
				return fmtErr(`Failed to create checkout directory ${checkoutDir}`, mkdirErr instanceof Error ? mkdirErr.message : 'Unknown error');
			}
		} else {
			return fmtErr(`Error while checking if the directory ${checkoutDir} exists`, err instanceof Error ? err.message : 'Unknown error');
		}
	}
	return nOkAsync(undefined);
}


/**
 * Resolves the path to the repository directory.
 * @param checkoutPath The root directory to checkout the repository in
 * @param repoFolderName The name of the folder to checkout the repository in
 * @returns 
 */
export function repoDirPath(checkoutPath: string, repoFolderName: string): string {
	return path.resolve(checkoutPath, repoFolderName);
}

/**
 * Resolves the path to the checkout directory.
 * @param rootDir The root directory to checkout the repository in
 * @param checkoutFolderName The name of the folder to checkout the repository in
 * @returns 
 */
export function checkoutDirPath(rootDir: string, checkoutFolderName: string): string {
	return path.resolve(rootDir, checkoutFolderName);
}

function fmtCheckoutErrRes(errMsg: string): ResultAsync<void, Error> {
	return nErrAsync(new Error(`Failed to checkout the repo: ${errMsg}`));
}