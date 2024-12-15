/**
 * @module
 * @param overridePackageName The package name to override the default package name with (other than the default, aero)
 * @returns 
 */

// Neverthrow
import type { ResultAsync } from "neverthrow";
import { okAsync, errAsync as nErrAsync } from "neverthrow";
import { fmtNeverthrowErr } from "./fmtErrTest";

import packageJSON from "../../package.json" with { type: "json" };

type packageVersions = string[];

const commonAction = "to get the published NPM versions of the package";

export default async function getNPMVersions(overridePackageName?: string): Promise<ResultAsync<packageVersions, Error>> {
	let npmPackageName: string;
	if (overridePackageName)
		npmPackageName = overridePackageName;
	else {
		if (!("name" in packageJSON))
			return nErrAsync("No name field found in aero's package.json, required to get the default NPM package name");
		npmPackageName = packageJSON.name;
	}
	let npmRegistryResp: Response;
	try {
		npmRegistryResp = await fetch(`https://registry.npmjs.com/${npmPackageName}`);
		// biome-ignore lint/suspicious/noExplicitAny: It is an `Error` object
	} catch (err: any) {
		// @ts-ignore
		return fmtNeverthrowErr(`Failed to fetch the NPM Registry info, ${commonAction}, ${npmPackageName}`, err.message);
	}
	if (!npmRegistryResp.ok)
		return nErrAsync(`The status was invalid when trying to fetch the NPM Registry info, ${commonAction}, ${npmPackageName}: ${npmRegistryResp.statusText}`);
	if (!npmRegistryResp.headers.has("content-type"))
		return nErrAsync("There is no content-type header, so it is not safe to assume the response back is a JSON. Perhaps the NPM registry is down?");
	// @ts-ignore: We have already checked if the content-type is present
	if (!npmRegistryResp.headers.get("content-type").includes("application/json"))
		return fmtNeverthrowErr(`The content type was not a JSON when trying to fetch the NPM Registry info, ${commonAction}, ${npmPackageName}`, npmRegistryResp.headers.get("content-type"));
	let npmRegistryJSON: {
		versions: Record<string, unknown>
	};
	try {
		npmRegistryJSON = await npmRegistryResp.json();
	} catch (err) {
		return fmtNeverthrowErr(`Failed to parse the NPM Registry JSON, which was expected to contain the NPM versions we need, ${commonAction}, ${npmPackageName}`, err.message);
	}
	if (!("versions" in npmRegistryResp))
		return nErrAsync("No versions field found in the NPM Registry JSON; expected to find the NPM versions we need there");
	return okAsync(Object.keys(npmRegistryJSON.versions).reverse());
}