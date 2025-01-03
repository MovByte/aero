// Neverthrow
import type { ResultAsync } from "neverthrow";
import { okAsync } from "neverthrow";
import { fmtNeverthrowErr } from "../../util/fmtErrTest.ts";

import { resolve } from "node:path";

// Utility
import getNPMVersions from "../../util/getNPMVersions.ts";
import safeWriteFileToDir from "../../../WPTUtils/src/safeWriteFileToDir.ts";

/**
 * The standard output as in `https://wpt.fyi/api/versions?product=...`; this will also be published with the GitHub Actions and shown on `https://aero.sh/stats/api/versions.json`
 * This is a helper function meant to be for internal-use only, but it is exposed just in case you want to use it for whatever reason.
 */
export async function writeNPMVersions(outdir = resolve(__dirname, "testResults/api/versions.json")): Promise<ResultAsync<void, Error>> {
	const npmVersionsRes = await getNPMVersions();
	if (npmVersionsRes.isErr())
		return fmtNeverthrowErr("Failed to get the NPM package versions for aero", npmVersionsRes.error);
	const npmVersions = npmVersionsRes.value;

	await safeFileWriteToDir(outdir, JSON.stringify(npmVersions));

	return okAsync(undefined);
}