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

import type {
    AeroGelConfig
} from "../../../../types/rewriters/js";

import AeroGelGeneric from "./shared/AeroGelGeneric";

import processKeyword from "../ProxyParse/src/keywordProcessor";
import { replaceVarAssignmentKeywordWithFakeVarNamespace, replaceAssignmentKeyword, replaceMethod } from "../ProxyParse/src/replaceKeywords";
import { containsAmbiguousAccess } from "../ProxyParse/src/internal/checks";

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
    constructor(config: AeroGelConfigFull) {
        super(config);
    }
    /**
     * Apply a new config later
     * @param config The new AeroGel config to apply
     */
    applyNewConfig(config: AeroGelConfigFull) {
        super.applyNewConfig(config);
    }

    /**
     * This essentially the rewriter
     * @param script The script to jail. Before it is jailed the let/const to fake vars RegExp rewriting occurs.
     * @param config The config for the AeroGel parsing
     * @param isModule Module scripts don't need to be rewrote because they don't require fake vars for scope emulation since module scripts run in their own isolated scope.
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
            aeroGelConfig: {
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
export function rewriteScript(script: string, config: {
    trackBlockDepth: boolean,
    trackPropertyChain: boolean,
    trackProxyApply: boolean
}): Result<string, Error> {
    let res = "";
    const iterator = processKeyword(script, {
        trackBlockDepth: config.trackBlockDepth,
        trackPropertyChain: config.trackPropertyChain,
        trackProxyApply: config.trackProxyApply
    });
    // @ts-ignoe
    for (let { char, i, blockDepth = 0, inNewStatement = false, inPropertyChain = false, currentChain = null, propertyChainEnded = false, enteredProxyTrackingHandler = false } of iterator) {
        if (enteredProxyTrackingHandler) {
            // TODO: When you just enter it, inject what is needed and skip the number of times (make a var for the "skipQueue")
        }

        // Rewrite `let`, `const`, `eval`, and `location` only at the start of a new statement
        if (blockDepth === 1 && inNewStatement) {
            // Rewrite `let` with the fake var namespace from the config provided in this class
            {
                const { newRes, shouldContinue } = replaceVarAssignmentKeywordWithFakeVarNamespace(iterator, i, script, res, "let", this.config.letNamespace);
                res = newRes;
                if (shouldContinue)
                    continue;
            }

            // Rewrite `const` with the fake var namespace from the config provided in this class
            {
                const { newRes, shouldContinue } = replaceVarAssignmentKeywordWithFakeVarNamespace(iterator, i, script, res, "const", this.config.letNamespace);
                res = newRes;
                if (shouldContinue)
                    continue;
            }

            // Rewrite `eval` with the proxified version of it if it is in a module script
            if (this.config.isModule) {
                const { newRes, shouldContinue } = replaceMethod(iterator, i, script, res, "eval", this.config.proxifiedEvalPropTree);
                res = newRes;
                if (shouldContinue)
                    continue;
            }

            // Intercept the `location = ...` assignment and rewrite it to `<locationNamespace>.location = ...` to prevent a no-op
            {
                const { newRes, shouldContinue } = replaceAssignmentKeyword(iterator, i, script, res, "location", this.config.locationNamespace);
                res = newRes;
                if (shouldContinue)
                    continue;
            }
        } else if (
            currentChain !== null
        ) {
            if (propertyChainEnded)
                res += containsAmbiguousAccess(currentChain) ?
                    // If the chain contains `window` or `location`, wrap with the check function provided
                    `${config.checkFuncPropTree}(${currentChain})` :
                    // No wrapping needed; append the chain as-is
                    currentChain;
            else
                // We need to wait and see what happens next
                continue;
        }
        // Nothing to do, keep going
        res += char;
    }

    return ok(res);
}