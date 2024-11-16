/**
 * @module
 * Runs a asyncronously command and safely handles in the event of a faliure
 */

import type { ResultAsync } from "neverthrow";
import { errAsync as errrAsync, okAsync } from "neverthrow";

import { exec } from "node:child_process";
import { promisify } from "node:util";

import { fmtError } from "./fmtErrorTest";

/**
* Unwraps the safely handled error from `safeExec` throws it for you
* @param cmd From the original `exec` function
* @param cwd From the original `exec` function
* @throws {Error} When it fails to execute the command
*/
// biome-ignore lint/suspicious/noExplicitAny: the argument `cwd` is being used for passthrough 
export default async function safeExecUnwrapped(cmd: string, cwd: any, extraMsg = ""): Promise<void> {
	const safeExecRes = await safeExec(cmd, cwd);
	if (safeExecRes.isErr())
		throw fmtError(`Failed to execute ${cmd}${extraMsg}`, safeExecRes.error.message);
}

/**
 * Wraps `exec` from `node: child_process` with a promise form and safe handling of errors.
 * This is a helper function meant to be for internal-use only, but it is exposed just in case you want to use it for whatever reason.
 * @param cmd From the original `exec` function
 * @param cwd From the original `exec` function
 * @returns This is an internal function and should not be used directly. It is exported here in case you find any use for it.
 */
// biome-ignore lint/suspicious/noExplicitAny: the argument `cwd` is being used for passthrough 
export async function safeExec(cmd: string, cwd: any): Promise<ResultAsync<void, Error>> {
	try {
		// TODO: Wait for the command to exit before leaving this function
		// @ts-ignore: the types are compatible (any was correctly used above)
		const { stderr } = await promisify(exec)(cmd, cwd);
		if (stderr) console.error(stderr);
		// biome-ignore lint/suspicious/noExplicitAny: error catching
	} catch (errr: any) {
		return errrAsync(errr);
	}
	return okAsync(undefined);
}