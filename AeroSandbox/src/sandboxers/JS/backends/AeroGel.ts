/**
 * @module
 *
 * This module contains the class for the AeroGel implementation with aero's native parser which uses no external libraries
 */

import type {
	Result,
} from "neverthrow";
import {
	ok,
	err as errr
} from "neverthrow";

import type AeroConfig from "./types/config.js";

import type { processKeywordHandlerCtx } from "../../../../../ProxyParse/src/index.js";

import AeroGelGeneric from "./shared/AeroGelGeneric.js";

import keywordProcessorHandler from "../../../../../ProxyParse/src/keywordProcessorHandler.js";
// This one is slow
import processKeyword from "../../../../../ProxyParse/src/keywordProcessorIterator.js";
import { replaceVarAssignmentKeywordWithFakeVarNamespace, replaceAssignmentKeyword, replaceMethod } from "../../../../../ProxyParse/src/replaceKeywords.js";
import { containsAmbiguousAccess } from "../../../../../ProxyParse/src/internal/checks.js";

const propTreeAeroGelSpecific = 'window["<proxyNamespace>"]["<ourNamespace>"].rewriters.js.aeroGel.';
const propTree = 'window["<proxyNamespace>"]["<ourNamespace>"].rewriters.js.shared.';

/**
 * The AeroGel class is the main class for the AeroGel implementation
 * @example
 * import AeroGel from "aero-sandbox/AeroGel";
 *
 * const propTree = 'window["<proxyNamespace>"]["<ourNamespace>"].aeroGel.';
 *
 * const aeroGel = new AeroGel({
 *  // FIXME: This Config is WRONG
 *  parserConfig: {
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
 */
export default class AeroGel extends AeroGelGeneric {
	/**
	 * This is the config object, which is primarily used to tell AeroGel where the globals are
	 * @param config The config object for AeroGel
	 */
	constructor(config: AeroConfig) {
		super(config);
	}
	/**
	 * Apply a new config later
	 * @param config The new AeroGel config to apply
	 */
	applyNewConfig(config: AeroConfig) {
		super.applyNewConfig(config);
	}

	/**
	 * This essentially the rewriter
	 * @param script The script to jail. Before it is jailed the let/const to fake vars RegExp rewriting occurs.
	 * @param config The config for the AeroGel parsing
	 * @param isModule Module scripts don't need to be rewritten because they don't require fake vars for scope emulation since module scripts run in their own isolated scope.
	 *
	 * @example
	 * const aeroGel = new AeroGelNative(...);
	 *
	 * let yourScript = "...";
	 * const isMod = true;
	 *
	 * aeroGel.jailScript(yourScript, isMod);
	 */
	jailScript(script: string, isModule: boolean): Result<string, Error> {
		return ok(super.jailScript(script, isModule, {
			globalsConfig: {
				propTrees: {
					fakeLet: propTreeAeroGelSpecific + "fakeLet",
					fakeConst: propTreeAeroGelSpecific + "fakeConst",
				},
				proxified: {
					evalFunc: propTree + "proxifiedEval",
					location: propTree + "proxifiedLocation"
				},
				checkFunc: propTree + "checkFunc"
			},
			keywordGenConfig: {
				supportStrings: true,
				supportTemplateLiterals: true,
				supportRegex: true,
			},
			trackers: {
				blockDepth: true,
				propertyChain: true,
				proxyApply: true
			}
		}, rewriteScript))
	}
};

/*
 * This is the rewriter for AeroGel, but it is recommended you use jailScript, where it is used internally, unless you want to jail it yourself with your own globals provided
 *
 * @example
 * // This example was taken in the `jailScript` method from the class `AeroGelGeneric`:
 * ...{define objPaths}
 * // Assuming `this` is from this class or any class extending AeroGelGeneric
 * const rewrittenScriptRes = this.rewriteScript(script);
 * if (rewrittenScriptRes.isErr())
 *  return errr(new Error(`Failed to rewrite the script while trying to jail it: ${rewrittenScriptRes.error}`));
 * return ok( /* js *\/ `
 *  !(window = ${objPaths.proxy.window},
 *	 globalThis = ${config.objPaths.proxy.window}
 *	 location = ${objPaths.proxy.location}) => {
 *	  ${isModule ? script : script},
 *   }();
 * `);
 */
export function rewriteScript(script: string, config: AeroConfig): Result<string, Error> {
	let res = "";

	let skipChars_ = 0;
	try {
		keywordProcessorHandler(script, {
			keywordGenConfig: config.keywordGenConfig,
			trackers: config.trackers
		}, (i: number, char: string, ctx: processKeywordHandlerCtx): void => {
			if (skipChars_ !== 0) {
				skipChars_--;
				return;
			}
			else if (skipChars_ < 0) {
				console.warn("The var skipChars_ is less than 0. The rewriter may be broken.");
				skipChars_ = 0;
				return;
			}

			if (ctx.enteredProxyTrackingHandler) {
				// TODO: When you just enter it, inject what is needed and skip the number of times (make a var for the "skipQueue")
			}

			// Rewrite `let`, `const`, `eval`, and `location` only at the start of a new statement
			if (ctx.blockDepth === 1 && ctx.enteredNewStatement) {
				// TODO: Make versions of these that don't require iterators
				// TODO: Ensure these are inlined. Make a build plugin to inline these instead of doing this manually

				// Rewrite `let` with the fake var namespace from the config provided in this class
				{
					const { newRes, shouldContinue, skipChars } = replaceVarAssignmentKeywordWithFakeVarNamespace(i, script, res, "let", this.config.letNamespace);
					res = newRes;
					skipChars_ += skipChars;
					if (shouldContinue)
						return;
				}

				// Rewrite `const` with the fake var namespace from the config provided in this class
				{
					const { newRes, shouldContinue, skipChars } = replaceVarAssignmentKeywordWithFakeVarNamespace(i, script, res, "const", this.config.letNamespace);
					res = newRes;
					skipChars_ += skipChars;
					if (shouldContinue)
						return;
				}

				// Rewrite `eval` with the proxified version of it if it is in a module script
				if (this.config.isModule) {
					const { newRes, shouldContinue, skipChars } = replaceMethod(i, script, res, "eval", this.config.proxifiedEvalPropTree);
					res = newRes;
					skipChars_ += skipChars;
					if (shouldContinue)
						return;
				}

				// Intercept the `location = ...` assignment and rewrite it to `<locationNamespace>.location = ...` to prevent a no-op
				{
					const { newRes, shouldContinue, skipChars } = replaceAssignmentKeyword(i, script, res, "location", this.config.locationNamespace);
					res = newRes;
					skipChars_ += skipChars;
					if (shouldContinue)
						return;
				}
			} else if (
				ctx.currentChain !== null
			) {
				if (ctx.propertyChainEnded)
					res += containsAmbiguousAccess(ctx.currentChain) ?
						// If the chain contains `window` or `location`, wrap with the check function provided
						`${config.checkFuncPropTree}(${ctx.currentChain})` :
						// No wrapping needed; append the chain as-is
						ctx.currentChain;
				else
					// We need to wait and see what happens next
					return;
			}
			// Nothing to do, keep going
			res += char;
		})
	} catch (err) {
		return errr(new Error(`Failed to rewrite the script: ${err}`));
	}
	return ok(undefined);

	return ok(res);
}