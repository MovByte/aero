/**
 * @module
 * 
 * AeroJet is a DPSC implementation in AST for aero
 */

import type { Result } from "neverthrow";
import { ok, err as errr } from "neverthrow";

import type {
	astParser,
	astWalker,
	ASTRewriterConfig
} from "../../../../types/rewriters/js";

// Parsers
// import initWasm, { parseSync } from "@oxc-parser/wasm";
import { parse } from "seafox";

// Walkers
import traverse from "traverse-the-universe";

// AST -> JS
// This is the only realistic option
import { generate, type Node } from "astring";
import RewriterGeneric from "./shared/RewriterGeneric";

// Strings
export const noSuitableAstWalkersFoundMsg = "No suitable AST walkers found; not rewriting!";

export default class ASTRewriter extends RewriterGeneric {
	config: ASTRewriterConfig;

	constructor(config: ASTRewriterConfig) {
		super(config);
	}
	applyNewConfig(config: ASTRewriterConfig) {
		super.applyNewConfig(config);
	}

	// These two methods are here because it is possible to compile out the AST parsers and walkers that the user chooses in the build flags
	static supportedParsers(): astParser[] {
		const supports: astParser[] = [];
		if (INCLUDE_AST_PARSER_OXC) supports.push("oxc");
		if (INCLUDE_AST_PARSER_SEAFOX) supports.push("seafox");
		return supports;
	}
	static supportedWalkers(): astWalker[] {
		const supports: astWalker[] = [];
		if (INCLUDE_AST_WALKER_TRAVERSE_THE_UNIVERSE)
			supports.push("traverse_the_universe");
		return supports;
	}
	rewriteScript(script: string, isModule: boolean): Result<string, Error> {
		const [ast, windowProxyConcealmentAst] = this.parseAst(
			script,
			isModule
		);
		const rewroteAst = this.rewriteFromAst(ast, windowProxyConcealmentAst);
		let rewroteAstString: string;
		try {
			// @ts-ignore We know the AST Nodes are compatible between libraries
			rewroteAstString = generate(rewroteAst)
		} catch (err) {
			return errr(new Error(`Failed to convert the rewrote AST to a string: ${err.message}`));
		}
		return ok(rewroteAstString);
	}
	/**
	 * I recomend using (@link https://astexplorer.net) to guide you when coming up with ideas of how to rewrite the AST
	 * @param ast The AST tree
	 * @param ast The AST used to conceal the window object in the Proxy object. Note: this is only done in AeroJet because ProxyProxy is used in AeroGel. The ProxyProxy could be used here, but the ProxyProxy is janky in that it requires emulating the original `that` expected from the `Proxy` object, which is destroyed when a Proxy is created for an already proxified object by AeroSandbox. This emulation involves throwing errors and catching them to determine the position, so it can get the original `that` object. It generally should be preferred to do the parsing method here, but the whole point of AeroGel is to discourage heavy parsing, so it is reserved for AeroJet. TODO: I will eventually make a feature flag that allows this same behavior while using AeroGel.
	 * @returns the rewrote script in AST form
	 */
	rewriteFromAst(ast: Node, windowProxyConcealmentAst: Node): Result<Node, Error> {
		if (INCLUDE_AST_WALKER_TRAVERSE_THE_UNIVERSE)
			// @ts-ignore `traverse-the-universe` has no typings
			traverse(ast, node => {
				// Wrap entire property chains with `$aero.check` if any part contains "window" or "location" (ambiguous access detection)
				if (node.type === "MemberExpression" && this.containsTargetOrComputed(node)) {
					// Wrap the property chain with `$aero.check`
					const wrappedNode = this.createAeroCheckCall(node, this.config.checkFuncPropTree);
					// @ts-ignore `traverse-the-universe` has no typings
					// Apply the wrapping
					this.replace(wrappedNode);
				}
				if (
					node.type === "Identifier" &&
					node.name === "that" &&
					node.parentNode &&
					node.parentNode.type === "FunctionExpression" &&
					node.parentNode.parentNode.type === "Property" &&
					node.parentNode.parentNode.key.type === "Identifier" &&
					node.parentNode.parentNode.key.name === "apply" &&
					node.parentNode.parentNode.parentNode ===
					"ObjectExpression" &&
					node.parentNode.parentNode.parentNode.parentNode ===
					"NewExpression" &&
					// @ts-ignore
					node.parentNode.parentNode.parentNode.parentNode.callee.name === "Proxy"
				)
					node.parentNode.body.insertAfter(windowProxyConcealmentAst);
			});
		else
			return errr(new Error(noSuitableAstWalkersFoundMsg));
		return ok(ast);
	}
	parseAst(script: string, isModule: boolean): Result<[Node, Node], Error> {
		if (INCLUDE_AST_PARSER_OXC) {
			/** @see (@link https://www.npmjs.com/package/@oxc-parser/wasm?activeTab=readme) */
			return errr(new Error("OXC is unsupported at the moment"));
		}
		if (INCLUDE_AST_PARSER_SEAFOX) {
			return ok([
				// @ts-ignore These types are compatible with the AST
				parse(script, {
					module: isModule,
					next: true
				}).body as Node,
				// @ts-ignore These types are compatible with the AST
				parse(
					/** js  */ `
					if (that === window) {
						that = window;
					}
				`,
					{
						module: isModule,
						next: true
					}
				).body as Node
			]);
		}
		return errr(new Error("No suitable AST parsers found. Please configure one."));
	}
	/**
	 * A helper method to identify a targeted member expression chain
	 * It works by checking if any property in the chain is `window` or `location` or uses computed access as created earlier
	 * @param node The node to check
	 * @returns Whether the node contains `window` or `location` or uses computed access
	 */
	containsTargetOrComputed(node: Node): boolean {
		let currentNode: Node = node;
		while (currentNode && currentNode.type === "MemberExpression") {
			if (
				// @ts-ignore
				(currentNode.property.type === "Identifier" &&
					// @ts-ignore
					(currentNode.property.name.includes("window") || currentNode.property.name.includes("location"))) ||
				// @ts-ignore This is a creation by AeroJet earlier
				currentNode.computed
			) {
				return true;
			}
			// @ts-ignore
			currentNode = currentNode.object;
		}
		return false;
	}
	/**
	 * A helper method to create the `$aero.check(...)` call node
	 * It creates a CallExpression using a specified wrapper object property path like `aero.check`, which can be customized
	 * This should only be used internally in an implementation of `rewriteFromAst`
	 */
	createAeroCheckCall(node: Node, objectPropertyPath: string): Node {
		/** Split path by dots, e.g., ["$aero", "check"] */
		const pathParts = objectPropertyPath.split('.');

		// Convert the path into nested MemberExpressions
		// @ts-ignore
		const callee = pathParts.reduceRight((property, name) => ({
			type: "MemberExpression",
			object: { type: "Identifier", name },
			property: typeof property === "string" ? { type: "Identifier", name: property } : property,
			computed: false
		}));

		return {
			type: "CallExpression",
			// @ts-ignore
			callee,
			arguments: [node]
		};
	}
}
