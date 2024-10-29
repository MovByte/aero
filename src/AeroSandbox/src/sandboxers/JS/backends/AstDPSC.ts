import type {
	astParser,
	astWalker,
	ASTRewriterConfig
} from "../../../../types/aeroSandbox";

// Parsers
// import initWasm, { parseSync } from "@oxc-parser/wasm";
import { parse } from "seafox";

// Walkers
import traverse from "traverse-the-universe";

// AST -> JS
// This is the only realistic option
import { generate, type Node } from "astring";

// Strings
export const noSuitableAstWalkersFoundMsg = "No suitable AST walkers found; not rewriting!";

export default class ASTRewriter {
	config: ASTRewriterConfig;
	parentNode: boolean;
	constructor(config: ASTRewriterConfig) {
		this.config = config;
	}
	applyNewConfig(config: ASTRewriterConfig) {
		this.config = config;
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
	/**
	 * I recomend using (@link https://astexplorer.net) to guide you when coming up with ideas of how to rewrite the AST
	 * @param ast - The AST tree
	 * @returns the rewrote script
	 */
	rewriteFromAst(ast: Node, windowProxyConcealmentAst: Node): Node {
		if (INCLUDE_AST_WALKER_TRAVERSE_THE_UNIVERSE) {
			// traverse-the-universe has no typings
			traverse(ast, node => {
				if (node.type === "Identifier" && node.name === "location") {
					// TODO: Include more checks to ensure that this is the proper `location` that we want to rewrite
					node.name = this.config.objPaths.proxy.location;
				}
				if (node.type === "Identifier" && node.name === "window") {
					// TODO: Include more checks to ensure that this is the proper `window` that we want to rewrite
					node.name = this.config.objPaths.proxy.window;
				}
				// TODO: Perform DPSC here
				if (
					node.type === "Identifier" &&
					node.name === "that" &&
					// @ts-ignore
					this.parentNode &&
					// @ts-ignore
					this.parentNode.type === "FunctionExpression" &&
					// @ts-ignore
					this.parentNode.parentNode.type === "Property" &&
					// @ts-ignore
					this.parentNode.parentNode.key.type === "Identifier" &&
					// @ts-ignore
					this.parentNode.parentNode.key.name === "apply" &&
					// @ts-ignore
					this.parentNode.parentNode.parentNode ===
						"ObjectExpression" &&
					// @ts-ignore
					this.parentNode.parentNode.parentNode.parentNode ===
						"NewExpression" &&
					// @ts-ignore
					this.parentNode.parentNode.parentNode.parentNode.callee
						.name === "Proxy"
				) {
					// @ts-ignore
					this.parentNode.body.insertAfter(windowProxyConcealmentAst);
				}
			});
		} else
			$aero.logger.fatalErr(noSuitableAstWalkersFoundMsg);
	}
	parseAst(script: string, isModule: boolean): [Node, Node] {
		if (INCLUDE_AST_PARSER_OXC) {
			/** @see (@link https://www.npmjs.com/package/@oxc-parser/wasm?activeTab=readme) */
			$aero.logger.fatalErr("OXC is unsupported at the moment!");
		}
		if (INCLUDE_AST_PARSER_SEAFOX) {
			return [
				parse(script, {
					module: isModule,
					next: true
				}).body as Node,
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
			];
		}
	}
	rewriteScript(script: string, isModule: boolean): string {
		const [ast, windowProxyConcealmentAst] = this.parseAst(
			script,
			isModule
		);
		const rewroteAst = this.rewriteFromAst(ast, windowProxyConcealmentAst);
		return generate(rewroteAst);
	}
}
