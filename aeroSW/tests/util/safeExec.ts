/**
 * @module
 * Runs a asyncronously command and safely handles in the event of a faliure
 */

import { ResultAsync } from "neverthrow";
import { fmtErr } from "../util/fmtErrTest.ts";

import { spawn, type SpawnOptionsWithoutStdio } from "node:child_process";

/**
* Unwraps the safely handled error from `safeExec` throws it for you
* @param cmd From the original `exec` function
* @param cwd From the original `exec` function
* @throws {Error} When it fails to execute the command
*/
// biome-ignore lint/suspicious/noExplicitAny: the argument `cwd` is being used for passthrough 
export default async function safeExecUnwrapped(cmd: string, cwd: SpawnOptionsWithoutStdio, extraMsg = ""): Promise<void> {
	const safeExecRes = await safeExec(cmd, cwd);
	if (safeExecRes.isErr())
		throw fmtErr(`Failed to execute ${cmd}${extraMsg}`, safeExecRes.error.message);
}

/**
 * Wraps `exec` from `node: child_process` with a promise form and safe handling of errors.
 * This is a helper function meant to be for internal-use only, but it is exposed just in case you want to use it for whatever reason.
 * @param cmd From the original `exec` function
 * @param cwd From the original `exec` function
 * @returns This is an internal function and should not be used directly. It is exported here in case you find any use for it.
 */
// biome-ignore lint/suspicious/noExplicitAny: the argument `cwd` is being used for passthrough 
export async function safeExec(cmd: string, cwd: any): Promise<ResultAsync<{
	successful: boolean,
	out: string,
	errOut: string,
	processErr?: string
}, Error>> {
	return ResultAsync.fromPromise(
		new Promise<{
			successful: boolean;
			out: string;
			errOut: string;
			processErr?: string;
		}>((resolve, reject) => {
			let out = "";
			let errOut = "";

			const child = spawn(cmd, cwd, { stdio: "pipe" });

			child.stdout.on("data", (data) => {
				out += data.toString();
			});

			child.stderr.on("data", (data) => {
				errOut += data.toString();
			});

			child.once("error", (error) => {
				reject({
					successful: false,
					out,
					errOut,
					processErr: error.message
				});
			});

			child.once("exit", (code) => {
				if (code === 0) {
					resolve({
						successful: true,
						out,
						errOut
					});
				} else {
					reject({
						successful: false,
						out,
						errOut,
						processErr: `Exited with code ${code}`
					});
				}
			});
		}),
		// @ts-ignore
		(err: Error) => fmtErr("Failed to execute a command", err.message)
	);
}