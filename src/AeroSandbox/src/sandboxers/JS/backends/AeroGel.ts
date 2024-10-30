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
    AeroGelConfig,
    AeroGelParserConfig,
    aerogelParser
} from "../../../../types/rewriters/js";

import AeroGelGeneric from "./shared/AeroGelGeneric";

import processKeyword from "../ProxyParse/keywordGenerator";
import { replaceVarAssignmentKeywordWithFakeVarNamespace, replaceAssignmentKeyword, replaceMethod } from "../ProxyParse/replaceKeyword";


/**
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
     */
    constructor(config: AeroGelConfig) {
        super(config);
    }
    /**
     * Apply a new config later
     * @param config The new AeroGel config to apply
     */
    applyNewConfig(config: AeroGelConfig) {
        super.applyNewConfig(config);
    }


    /**
     * This essentially the rewriter
     * @param script The script to jail. Before it is jailed the let/const to fake vars RegExp rewriting occurs.
     * @param config The config for the AeroGel parsing
     * @param isModule Module scripts don't need to be rewrote because they don't require fake vars for scope emulation since module scripts run in their own isolated scope.
     * @example
     * const aeroGel = new AeroGelNative(...);
     *
     * let yourScript = "...";
     * const isMod = true;
     *
     * aeroGel.jailScript(yourScript, isMod);
     */
    jailScript(script: string, aeroGelConfigOverrides: Partial<AeroGelConfig> = {}, isModule: boolean): Result<void, Error> {
        return super.jailScript(script, {
            letNamespace: `${this.config.parserConfig.fakeVarObjPropTree}.let`,
            constNamespace: `${this.config.parserConfig.propTrees.fakeObj}.const`,
            locationFuncNamespace: this.config.parserConfig.propTrees.proxified.location,
            evalFuncNamespace: this.config.parserConfig.propTrees.proxified.eval,
            respectStrings: true,
            respectTemplateLiterals: true,
            respectRegex: true,
            proxifiedEvalPropTree: this.config.parserConfig.propTrees.proxified.eval,
            ...aeroGelConfigOverrides
        } as AeroGelConfig, isModule)
    }
    rewriteScript(script: string, config: AeroGelParserConfig): Result<string, Error> {
        let res = "";
        const iterator = processKeyword(script, config);
        for (let { char, i, blockDepth = 0, inNewStatement = false } of iterator) {
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
            }
            // Nothing to do, keep going
            res += char;
        }

        return ok(res);
    }
};
