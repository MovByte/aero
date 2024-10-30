import type { Result, ok, err as errr } from "neverthrow";

import type {
	AeroGelConfig,
	aerogelParser,
	keywordReplacementType
} from "../../../../types/aeroSandbox";

import AeroGelBare from "./shared/AeroGelGeneric";

// This is so that it can use parseAST
import { default as AST, noSuitableAstWalkersFoundMsg } from "./AST";

// Parsers
// import initWasm, { parseSync } from "@oxc-parser/wasm";
import { parse } from "seafox";

// Walkers
import traverse from "traverse-the-universe";

// AST -> JS
// This is the only realistic option
import { generate, type Node } from "astring";

/**
 * @example
 * import AeroGel from "aero-sandbox/AeroGel";
 *
 * const propTree = 'window["<proxyNamespace>"]["<ourNamespace>"].aeroGel.';
 *
 * const aeroGel = new AeroGel({
 *  parserConfig: {
 *   parser: "ast",
 *   objPaths: {
 *    proxyNamespace: "testProxyNamespace",
 *    ourNamespace: "sandbox",
 *    objPaths: {
 *     proxy: {
 *      fakeVars: {
 *       let: propTree + "fakeVarsLet",
 *       const: propTree + "fakeVarsConst"
 *      }
 *     }
 *    }
 *   }
 *  }
 * });
 *
 * const yourScript = "...";
 * const isMod = true;
 *
 * aeroGel.jailScript(yourScript, isMod);
 */
export default class AeroGelAst extends AeroGelBare {
	config: AeroGelConfig;
	constructor(config: AeroGelConfig) {
		this.config = config;
	}
	applyNewConfig(config: AeroGelConfig) {
		this.config = config;
	}
	/**
	 * List the parsers that AeroGel AST has been compiled with via Feature Flags
	 */
	static supportedParsers(): aerogelParser[] {
		const supports: aerogelParser[] = [];
		if (INCLUDE_ESNIFF) supports.push("esniff");
		if (INCLUDE_AST_PARSER_OXC) supports.push("oxc");
		if (INCLUDE_AST_PARSER_SEAFOX) supports.push("seafox");
		return supports;
	}
	/**
	 * List the walkers that AeroGel AST has been compiled with via Feature Flags
	 */
	static supportedWalkers(): astWalker[] {
		const supports: astWalker[] = [];
		if (INCLUDE_AST_WALKER_TRAVERSE_THE_UNIVERSE)
			supports.push("traverse_the_universe");
		return supports;
	}
	/** This essentially the rewriter
	 * @param script The script to jail. Before it is jailed the let/const to fake vars RegExp rewriting occurs.
	 * @param isModule Module scripts don't need to be rewrote because they don't require fake vars for scope emulation since module scripts run in their own isolated scope.
	 * @example TODO: Provide an example
	 */
	jailScript(script: string, isModule: boolean): Result<void, Error> {
		return super.jailScript(script, isModule);
	}
	rewriteScript(script: string): Result<string, Error> {
		const [ast, windowProxyConcealmentAst] = AST.parseAst(script);
		if (INCLUDE_AST_WALKER_TRAVERSE_THE_UNIVERSE) {
			// traverse-the-universe has no typings
			traverse(ast, node => {
				if (node.type === "VariableDeclaration" && ["let", "const"].includes(node.kind)) {
					node.declarations.forEach((declaration) => {
						if (declaration.id.type === "ArrayPattern") {
							// Transform array destructuring to <fakeVar>.fakeArrayDestructure
							const newNode = types.memberExpression(
								types.identifier(this.config.parserConfig.fakeVarObjPropTree),
								types.identifier("fakeArrayDestructure")
							);
							this.replace({ ...node, id: newNode });
						} else if (declaration.id.type === "ObjectPattern") {
							// Transform object destructuring to <fakeVar>.fakeObjectDestructure
							const newNode = types.memberExpression(
								types.identifier(this.config.parserConfig.fakeVarObjPropTree),
								types.identifier("fakeObjectDestructure")
							);
							this.replace({ ...node, id: newNode });
						} else if (declaration.id.type === "Identifier") {
							// Transform normal variable to let.<variable name>
							const newNode = types.memberExpression(
								types.identifier(`${this.config.parserConfig.fakeVarObjPropTree}.${node.kind}.`),
								types.identifier(declaration.id.name)
							);
							this.replace({ ...node, id: newNode });
						}
					});
				}
				else if (node.type === "CallExpression" && node.callee.name === "eval") {
					// Transform `eval` to your sandbox library's proxified version of `eval`
					const newNode = types.callExpression(
						types.identifier(this.config.parserConfig.proxifiedEvalPropTree),
						node.arguments // Keep the same arguments as in the original `eval` call
					);
					this.replace(newNode);
				}
				else if (
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

			// Convert the modified AST back to a string and return it
			return generate.generate(ast);
		} else
			return errr(new Error(noSuitableAstWalkersFoundMsg));
	}
}
