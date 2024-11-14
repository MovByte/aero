import type { ResultAsync } from "neverthrow";
import { okAsync, errAsync as errrAsync } from "neverthrow";

import { envSafe, string, url } from "envSafe";

import { fileURLToPath } from "node:url";
import path from "node:path";

// biome-ignore lint/nursery/useImportRestrictions:
import checkoutRepo from "../shared/checkoutRepo";

const env = envSafe({
	PROXY_URL: url({
		devDefault: "http://localhost:2525/go/"
	}),
	WPT_REPO: url({
		devDefault: "https://github.com/web-platform-tests/wpt.git"
	}),
	WPT_DIR: string({
		devDefault: "WPT"
	})
});

const __dirname = fileURLToPath(new URL(".", import.meta.url));

/**
 * Checks out the Web Platform Tests (WPT) repository
 * This is a helper function meant to be for internal-use only, but it is exposed just in case you want to use it for whatever reason.
 * @param rootDir The root directory where the checkouts directory will reside
 */
export async function checkoutWPT(rootDir: string): Promise<ResultAsync<void, Error>> {
	const checkoutRepoRes = await checkoutRepo(env.WPT_REPO, rootDir, "WPT");
	if (checkoutRepoRes.isErr())
		return errrAsync(new Error(`Error while trying to checkout the WPT repo: ${checkoutRepoRes.error}`));

	return okAsync(undefined);
}

/**
 * Runs the `WPT - diff` test
 * @param rootDir The root directory where the checkouts directory will reside
 * @throws {Error} If there is an error while trying to run the test
 */
export default async function runTest(rootDir: string): Promise<void> {
	const checkoutWPTDirRes = await checkoutWPT(rootDir);
	if (checkoutWPTDirRes.isErr())
		throw new Error("Error while trying to checkout the WPT");

	// TODO: Implement
	// Use env.PROXY_URL when patching the WPT CLI script
}

/**
 * Detect if the script is being ran as a CLI script and not as a module
 */
const isCLI =
	// For Deno
	globalThis.Deno ? import.meta.main :
		// For Node
		// @ts-ignore: This is a NodeJS-only feature
		require.main === module;

if (isCLI) {
	const rootDir = path.resolve(__dirname, "..", "..");

	runTest(rootDir);
}