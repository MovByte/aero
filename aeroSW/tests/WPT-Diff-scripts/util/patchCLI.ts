/**
 * @module
 * Patches the official WPT CLI with a wrapped version of the browser you provide from the WPT-Diff tests config to be used to run WPT under a proxy
 */

// For type safety
/// Neverthrow
import type { Result, ResultAsync } from "neverthrow";
import { ok as nOk, okAsync as nOkAsync, errAsync as nErrAsync } from "neverthrow";
import { fmtNeverthrowErr } from "../../util/fmtErrTest.ts";
/// option-t
import { isNotNullOrUndefined } from "option-t/maybe";

import { resolve } from "node:path";
import { copyFile, readFile, writeFile } from "node:fs/promises";

import type { SyntaxNode, Tree } from "tree-sitter"
import Parser from "tree-sitter";
import Python from "tree-sitter-python";

// Utility
import checkoutRepo from "../../util/checkoutRepo.ts";

/**
 * Gets the WPT CLI and patches it for the *WPT-Diff* tests (to work under proxies)
 * This is a helper function meant to be for internal-use only, but it is exposed just in case you want to use it for whatever reason.
 */
export default async function setupPatchedCLI({ dirs, proxyURL, wptRepo, browser, proxyName }: {
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

	const browsersListRes = await patchBrowsersList(resolve(browserDir, "__init__.py"), proxyName);
	if (browsersListRes.isErr())
		return fmtNeverthrowErr("Failed to patch the browsers list", browsersListRes.error.message);
	const browsersList = browsersListRes.value;
	const browserClassRes = await patchBrowserClass(
		{
			browser,
			ogBrowserPath: resolve(browserDir, "chrome.py"),
			aeroBrowserPath: resolve(browserDir, `${proxyName}-chrome.py`),
			proxyURL
		});
	if (browserClassRes.isErr())
		return fmtNeverthrowErr("Failed to patch the browser class", browserClassRes.error.message);
	const browserClass = browserClassRes.value;

	writeFile(resolve(browserDir, `${proxyName}-chrome.py`), browserClass, "utf-8");
	writeFile(resolve(browserDir, "__init__.py"), browsersList, "utf-8");

	return nOkAsync(undefined);
}

/**
 * This is a helper function meant to be for internal-use only, but it is exposed just in case you want to use it for whatever reason
 * @param pass The passthrough data needed to patch the browsers list
 */
async function patchBrowsersList(pass: {
	/** The path to the `__init__.py` file in the browsers directory of the WPT tests */
	browserInitPath: string,
	/** The name of the proxy to add to the browsers list, which is used to specify the browsers you can run the tests under in WPT's CLI */
	proxyName: string
}): Promise<ResultAsync<void, Error>> {
	try {
		const browserInitCode = await readFile(browserInitPath, "utf-8");
		const modifier = new BrowsersListPatch(browserInitCode);
		const modifiedCodeResult = await modifier.addBrowserToProductList(proxyName);
		if (modifiedCodeResult.isErr()) return fmtNeverthrowErr("Failed to patch browsers list", modifiedCodeResult.error.message);
		await writeFile(browserInitPath, modifiedCodeResult.value, "utf-8");
		return nOkAsync(undefined);
	} catch (err) {
		return fmtNeverthrowErr("Failed to patch browsers list", err.message);
	}
}
/**
 * This is a helper function meant to be for internal-use only, but it is exposed just in case you want to use it for whatever reason
 * @param pass The passthrough data needed to patch the browsers list
 * @returns 
 */
async function patchBrowserClass({
	/** The browser to patch for */
	browser,
	/** The path to the original browser file used in reference to create the patched browser file at `aeroBrowserPath` */
	ogBrowserPath,
	/** The path to the patched browser file */
	aeroBrowserPath,
	/** The URL of the proxy to use in the patched browser class */
	proxyURL
}: { browser: string, ogBrowserPath: string, aeroBrowserPath: string, proxyURL: string }): Promise<ResultAsync<void, Error>> {
	try {
		await copyFile(ogBrowserPath, aeroBrowserPath);
		const ogBrowserCode = await readFile(aeroBrowserPath, "utf-8");
		const patcher = new BrowserClassModifier(ogBrowserCode);
		const patchRes = await patcher.patchBrowserClass({ browser, proxyURL });
		if (patchRes.isErr()) return fmtNeverthrowErr("Failed to patch the browser code", patchRes.error.message);
		await writeFile(aeroBrowserPath, patchRes.value, "utf-8");
		return nOkAsync(undefined);
	} catch (err) {
		return fmtNeverthrowErr("Failed to create browser patch", err.message);
	}
}


class BrowsersListPatch {
	/**
	 * The parser instance from the `tree-sitter` library
	 */
	private parser: Parser;
	private code: string;

	/**
	 * 
	 * @param code The code of the `__init__.py` file in the browsers directory of the WPT tests to patch
	 */
	constructor(code: string) {
		this.parser = new Parser();
		this.parser.setLanguage(Python);
		this.code = code;
	}

	public async addBrowserToProductList(proxyName: string): Promise<ResultAsync<string, Error>> {
		const tree = this.parser.parse(this.code);
		const maybeProductListNodeRes = this.findProductListNode(tree);
		if (maybeProductListNodeRes.isErr()) return nErrAsync(new Error("Failed to find the product_list assignment node"));
		const maybeProductListNode = maybeProductListNodeRes.value;
		if (!isNotNullOrUndefined(maybeProductListNode)) return nErrAsync(new Error("Failed to find the product_list assignment node"));

		const listElements = maybeProductListNode.namedChildren.map((node) => node.text);
		const proxyBrowser = `"${proxyName}-chrome"`;

		if (!listElements.includes(proxyBrowser)) listElements.push(proxyBrowser);

		const newArrayContent = "[" + listElements.join(", ") + "]";
		const modifiedCode = this.code.slice(0, maybeProductListNode.startIndex) + newArrayContent + this.code.slice(maybeProductListNode.endIndex);

		return nOkAsync(modifiedCode);
	}

	/**
	 * Find the product list node in the `__init__.py` file
	 * @param tree The AST tree of the `__init__.py` file
	 * @returns The `product_list` node in the AST tree
	 */
	private findProductListNode(tree: Tree): Maybe<SyntaxNode> {
		try {
			let productListNode: Maybe<SyntaxNode>;
			// @ts-ignore
			tree.rootNode.walk((node: SyntaxNode) => {
				if (node.type === "assignment") {
					const varNode = node.firstChild;
					if (varNode?.type === "identifier" && varNode.text === "product_list")
						// @ts-ignore
						productListNode = node.namedChildren.find((child) => child.type === "list");
				}
			});
			return productListNode;
		} catch (err) {
			return fmtNeverthrowErr("Failed to get product list node", err.message);
		}
	}
}

class BrowserClassModifier {
	/**
	 * The parser instance from the `tree-sitter` library
	 */
	private parser: Parser;
	/**
	 * TThe node tree after being parsed by `tree-sitter`
	 */
	private tree: Tree;
	private code: string;

	/**
	 * @param code The code of the browser class to patch
	 */
	constructor(code: string) {
		this.parser = new Parser();
		this.parser.setLanguage(Python);
		this.code = code;
		this.tree = this.parser.parse(code);
	}

	/**
	 * Patch the browser class
	 * @param pass The passthrough data needed to patch the browser class
	 */
	public async patchBrowserClass(pass: { browser: string, proxyURL: string }): Promise<ResultAsync<string, Error>> {
		const genericErr = "Failed to patch the browser class name to the target class name (ProxyBrowser)";
		try {
			const chromeBrowserNodeMaybeRes = this.findClassDef(`${this.capitalizeFirstLetter(pass.browser)}Browser`);
			if (chromeBrowserNodeMaybeRes.isErr()) return nErrAsync(chromeBrowserNodeMaybeRes.error);
			let chromeBrowserNodeMaybe = chromeBrowserNodeMaybeRes.value;
			let chromeBrowserNode: SyntaxNode;
			try {
				chromeBrowserNode = unwrapMaybe(chromeBrowserNodeMaybe);
			} catch (err) {
				return nErrAsync(new Error("Failed to find the browser class in the source code"));
			}

			const patchedCodeRes = await this.patchClassName(chromeBrowserNode, pass.proxyURL);
			if (patchedCodeRes.isErr())
				return nErrAsync(patchedCodeRes.error);
			let patchedCode = patchedCodeRes.value;
			return nOkAsync(patchedCode);
		} catch (err) {
			return fmtNeverthrowErr(genericErr, err.message);
		}
	}

	private capitalizeFirstLetter(str: string): string {
		return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
	}
	private findClassDef(className: string): Result<Maybe<SyntaxNode>, Error> {
		let classDefNodeMaybe: Maybe<SyntaxNode>;
		try {
			// @ts-ignore
			this.tree.rootNode.walk((node: SyntaxNode) => {
				if (node.type === "class_definition") {
					const nameNode = node.childForFieldName("name");
					if (nameNode && nameNode.text === className)
						return node;
				}
			});
		} catch (err) {
			return fmtNeverthrowErr("Failed to get class definition", err.message);
		}
		return nOk(classDefNodeMaybe);
	}
	/**
	 * Change the class name of the browser class to ProxyBrowser and add a URL property getter to the class that uses the proxy URL
	 * @param chromeBrowserNode Get the class node of the 
	 * @param proxyURL 
	 * @returns 
	 */
	private async patchClassName(chromeBrowserNode: SyntaxNode, proxyURL: string): Promise<ResultAsync<string, Error>> {
		try {
			const nameNode = chromeBrowserNode.childForFieldName("name");
			if (!nameNode) throw new Error("Could not find class name node");
			let patchCode = this.code.slice(0, nameNode.startIndex) + "ProxyBrowser" + this.code.slice(nameNode.endIndex);
			// This is used to insert our final url property getter into the class
			const index = this.getNodeIndex(chromeBrowserNode);
			const urlProperty = this.createUrlProperty(proxyURL);
			patchCode = patchCode.slice(0, index) + urlProperty + patchCode.slice(index);
			return nOkAsync(patchCode);
		} catch (err) {
			return fmtNeverthrowErr("Failed to patch class name to ProxyBrowser", err.message);
		}
	}
	/**
	 * Finds the index of the last function definition in the a class
	 * @param classNode The class to find the last function definition in so that the index of it can be returned
	 * @returns The index of the last function definition in the class
	 */
	private getNodeIndex(classNode: SyntaxNode): Maybe<number> {
		try {
			let index: Maybe<number>;
			// @ts-ignore
			classNode.walk((node: SyntaxNode) => {
				if (node.type === "function_definition" || node.type === "decorated_definition") {
					const index_ = node.endIndex;
					if (index_ > index)
						index = index_;
				}
			});
			return index;
		} catch (err) {
			return fmtNeverthrowErr("Failed to get class index", err.message);
		}
	}
	/**
	 * A method that formats the raw property getter code for the ProxyBrowser class that overrides the original URL property getter in the browser class
	 * @param proxyURL The URL of the proxy to use when forming the URL property
	 * @returns The raw Python code property getter for the URL property in the ProxyBrowser class
	 */
	private createUrlProperty(proxyURL: string): string {
		return `
		@property
		def url(self) -> str:
			if self.port is not None:
				return f"${proxyURL}http://{self.host}:{self.port}{self.base_path}"
			raise ValueError("Can't get WebDriver URL before port is assigned")
		`;
	}
}