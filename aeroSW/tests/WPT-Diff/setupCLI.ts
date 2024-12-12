// Neverthrow
import type { ResultAsync } from "neverthrow";
import { okAsync, errAsync as nErrAsync } from "neverthrow";
import { fmtNeverthrowErr } from "../util/fmtErrTest.ts";

import { resolve } from "node:path";
import { copyFile, readFile, writeFile } from "node:fs/promises";

import Parser from 'tree-sitter';
import Python from 'tree-sitter-python';

// Utility
import checkoutRepo from "../util/checkoutRepo.ts";


/**
 * Gets the WPT CLI and patches it for the *WPT-Diff* tests (to work under proxies)
 * This is a helper function meant to be for internal-use only, but it is exposed just in case you want to use it for whatever reason.
 */
export async function setupPatchedCLI({ checkoutDir, proxyURL, wptRepo }: {
	checkoutDir: string,
	proxyURL: string,
	wptRepo: string,
	browser: string
}): Promise<ResultAsync<void, Error>> {
	const checkoutRes = await checkoutRepo(wptRepo, checkoutDir, "WPT");
	if (checkoutRes.isErr())
		return fmtNeverthrowErr("Failed to checkout the WPT tests", checkoutRes.error.message);

	const patchBrowsersListRes = await patchBrowsersList({ checkoutDir });
	if (patchBrowsersListRes.isErr())
		return fmtNeverthrowErr("Failed to patch the WPT CLI", patchBrowsersListRes.error.message);

	const wptPath = resolve(checkoutDir, "WPT");
	copyFile(resolve(wptPath, "tools", "wptrunner", "browsers", "chrome.py"), resolve(wptPath, "tools", "wptrunner", "browsers", "aero-chrome.py"));


	return okAsync(undefined);
}

async function patchBrowsersList({ checkoutDir }: { checkoutDir: string }): Promise<ResultAsync<void, Error>> {
	const wptPath = resolve(checkoutDir, "WPT");
	const browserInitPath = resolve(wptPath, "tools", "wptrunner", "browsers", "__init__.py");

	const browserInitCode = await readFile(browserInitPath, "utf-8");

	// Parse the Python file into an AST
	const parser = new Parser();
	parser.setLanguage(Python);
	const tree = parser.parse(browserInitCode);

	let productListNode: any = null;

	// Find the `product_list` assignment
	tree.rootNode.walk((node) => {
		if (node.type === "assignment") {
			const varNode = node.firstChild;
			if (varNode && varNode.type === "identifier" && varNode.text === "product_list") {
				const listNode = node.namedChildren.find(child => child.type === 'list');
				if (listNode) {
					productListNode = listNode;
				}
			}
		}
	});

	if (productListNode) {
		const listElements = productListNode.namedChildren.map(node => node.text);

		// Add `aero-chrome` if it is not already in the product list
		if (!listElements.includes('"aero-chrome"') && !listElements.includes("'aero-chrome'")) {
			listElements.push('"aero-chrome"');
		}

		const newArrayContent = "[" + listElements.join(", ") + "]";

		const updatedFileContent = browserInitCode.slice(0, productListNode.startIndex) +
			newArrayContent +
			browserInitCode.slice(productListNode.endIndex);

		try {
			await writeFile(browserInitPath, updatedFileContent, "utf-8");
		} catch (err) {
			return fmtNeverthrowErr("Failed to write the updated `__init__.py` file", err.message);
		}
	} else {
		return nErrAsync("Unable to find the `product_list` assignment in the WPT CLI. Something is wrong with your WPT checkout.");
	}

	return okAsync(undefined);
}

async function createAeroBrowserPatch({ checkoutDir, browser }: { checkoutDir: string, browser: string }): Promise<ResultAsync<void, Error>> {
	const wptPath = resolve(checkoutDir, "WPT");
	const browserPath = resolve(wptPath, "tools", "wptrunner", "browsers");
	const aeroBrowserPath = resolve(browserPath, "aero-chrome.py");
}