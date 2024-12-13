/**
 * @module
 * Patches the CLI with a wrapped version of the browser you provide from the WPT-Diff tests config to be used to run WPT under a proxy
 */

// Neverthrow
import type { ResultAsync } from "neverthrow";
import { okAsync as nOkAsync, errAsync as nErrAsync } from "neverthrow";
import { fmtNeverthrowErr } from "../util/fmtErrTest.ts";

import { resolve } from "node:path";
import { copyFile, readFile, writeFile } from "node:fs/promises";

import type { SyntaxNode, Tree, Point } from "tree-sitter"
import Parser from "tree-sitter";
import Python from "tree-sitter-python";

// Utility
import checkoutRepo from "../util/checkoutRepo.ts";

/**
 * Gets the WPT CLI and patches it for the *WPT-Diff* tests (to work under proxies)
 * This is a helper function meant to be for internal-use only, but it is exposed just in case you want to use it for whatever reason.
 */
export async function setupCLI({ dirs, proxyURL, wptRepo, browser, proxyName }: {
	dirs: {
		checkout: string
	},
	proxyURL: string,
	wptRepo: string,
	browser: string
	proxyName: string
}): Promise<ResultAsync<void, Error>> {
	const checkoutRes = await checkoutRepo(wptRepo, dirs.checkout, "WPT");
	if (checkoutRes.isErr())
		return fmtNeverthrowErr("Failed to checkout the WPT tests", checkoutRes.error.message);

	const wptDir = resolve(dirs.checkout, "WPT");
	const browserDir = resolve(wptDir, "tools", "wptrunner", "browsers");

	if (typeof wptDir !== "string")
		return nErrAsync("Failed to resolve the WPT directory");
	if (typeof browserDir !== "string")
		return nErrAsync("Failed to resolve the browser directory");

	// Patch the browsers list
	const browserInitPath = resolve(browserDir, "__init__.py");
	try {
		const browserInitCode = await readFile(browserInitPath, "utf-8");
		const modifier = new BrowsersListModifier(browserInitCode);
		const modifiedCodeResult = await modifier.addBrowserToProductList(proxyName);
		if (modifiedCodeResult.isErr())
			return fmtNeverthrowErr("Failed to modify browsers list", modifiedCodeResult.error.message);
		await writeFile(browserInitPath, modifiedCodeResult.value, "utf-8");
	} catch (err) {
		return fmtNeverthrowErr("Failed to patch browsers list", err.message);
	}

	const aeroBrowserPath = resolve(browserDir, `aero-${browser}.py`);
	const ogBrowserPath = resolve(browserDir, `${browser}.py`);

	try {
		await copyFile(ogBrowserPath, aeroBrowserPath);
		const ogBrowserCode = await readFile(aeroBrowserPath, "utf-8");
		const modifier = new BrowserCodeModifier(ogBrowserCode);
		const modificationRes = await modifier.modifyBrowserCode({
			proxyURL
		});
		if (modificationRes.isErr())
			return fmtNeverthrowErr("Failed to modify browser code", modificationRes.error.message);
		await writeFile(aeroBrowserPath, modificationRes.value, "utf-8");
	} catch (err) {
		return fmtNeverthrowErr("Failed to create browser patch", err.message);
	}

	return nOkAsync(undefined);
}

class BrowsersListModifier {
	private parser: Parser;
	private code: string;

	constructor(code: string) {
		this.parser = new Parser();
		this.parser.setLanguage(Python);
		this.code = code;
	}

	public async addBrowserToProductList(proxyName: string): Promise<ResultAsync<string, Error>> {
		const tree = this.parser.parse(this.code);
		let productListNode: SyntaxNode | null = null;

		tree.rootNode.walk((node) => {
			if (node.type === "assignment") {
				const varNode = node.firstChild;
				if (varNode?.type === "identifier" && varNode.text === "product_list")
					productListNode = node.namedChildren.find(child => child.type === "list") || null;
			}
		});

		if (!productListNode)
			return nErrAsync(new Error("Unable to find the `product_list` assignment"));

		const listElements = productListNode.namedChildren.map(node => node.text);
		const proxyBrowser = `"${proxyName}-chrome"`;

		if (!listElements.includes(proxyBrowser))
			listElements.push(proxyBrowser);

		const newArrayContent = "[" + listElements.join(", ") + "]";
		const modifiedCode = this.code.slice(0, productListNode.startIndex) +
			newArrayContent +
			this.code.slice(productListNode.endIndex);

		return nOkAsync(modifiedCode);
	}
}


class BrowserCodeModifier {
	private parser: Parser;
	private tree: Tree;
	private code: string;

	constructor(code: string) {
		this.parser = new Parser();
		this.parser.setLanguage(Python);
		this.code = code;
		this.tree = this.parser.parse(code);
	}

	findClassDefinition(className: string): SyntaxNode | null {
		let classNode: SyntaxNode | null = null;
		this.tree.rootNode.walk((node) => {
			if (node.type === "class_definition") {
				const nameNode = node.childForFieldName("name");
				if (nameNode && nameNode.text === className) {
					classNode = node;
					return false;
				}
			}
			return true;
		});
		return classNode;
	}
	findLastMethodInClass(classNode: SyntaxNode): { index: number; position: Point } {
		let lastMethodEnd = 0;
		let lastPosition: Point = { row: 0, column: 0 };

		classNode.walk((node) => {
			if (node.type === "function_definition" || node.type === "decorated_definition") {
				const endIndex = node.endIndex;
				if (endIndex > lastMethodEnd) {
					lastMethodEnd = endIndex;
					lastPosition = node.endPosition;
				}
			}
			return true;
		});

		return { index: lastMethodEnd, position: lastPosition };
	}
	createUrlProperty(proxyURL: string): string {
		return `
    @property
    def url(self) -> str:
        if self.port is not None:
            return f"${proxyURL}/go/http://{self.host}:{self.port}{self.base_path}"
        raise ValueError("Can't get WebDriver URL before port is assigned")
	`;
	}

	public async modifyBrowserCode(options: { proxyURL: string }): Promise<ResultAsync<string, Error>> {
		try {
			const chromeBrowserNode = this.findClassDefinition("ChromeBrowser");
			if (!chromeBrowserNode)
				return nErrAsync(new Error("Could not find ChromeBrowser class in the source code"));

			const nameNode = chromeBrowserNode.childForFieldName("name");
			if (!nameNode)
				return nErrAsync(new Error("Could not find class name node"));

			// Perform the rename
			let modifiedCode = this.code.slice(0, nameNode.startIndex) +
				"ProxyBrowser" +
				this.code.slice(nameNode.endIndex);

			// Add the url property
			const { index: lastMethodEnd, position: lastMethodPosition } =
				this.findLastMethodInClass(chromeBrowserNode);
			const urlProperty = this.createUrlProperty(options.proxyURL);

			modifiedCode = modifiedCode.slice(0, lastMethodEnd) +
				urlProperty +
				modifiedCode.slice(lastMethodEnd);

			return nOkAsync(modifiedCode);
		} catch (error) {
			return fmtNeverthrowErr("Failed to modify the browser code", error.message);
		}
	}
}