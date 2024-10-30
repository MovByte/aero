/**
 * @module
 * 
 * This module contains the class for the AeroGel implementation with aero's native parser which uses no external libraries
 */

import type {
	Result,
	ok,
	err as errr
} from "neverthrow";

import type {
	AeroGelConfig,
	AeroGelParserConfig,
	aerogelParser
} from "../../../../types/js";

import AeroGelGeneric from "./shared/AeroGelGeneric";

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
 */
export default class AeroGelAst extends AeroGelGeneric {
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
			locationNamespace: this.config.parserConfig.propTrees.proxified.location,
			respectStrings: true,
			respectTemplateLiterals: true,
			respectRegex: true,
			proxifiedEvalPropTree: this.config.parserConfig.propTrees.proxified.eval,
			...aeroGelConfigOverrides
		}, isModule)
	}
	rewriteScript(script: string, config: AeroGelParserConfig): Result<string, Error> {
		let res = "";
		let inString = false;
		let inTemplateLiteral = false;
		let inRegex = false;
		let escapeNext = false;
		// Block depth counter
		let blockDepth = 0;

		for (let i = 0; i < code.length; i++) {
			const char = code[i];

			// Handle escape character
			if (escapeNext) {
				escapeNext = false;
				res += char;
				continue;
			}
			if (char === '\\') {
				escapeNext = true;
				res += char;
				continue;
			}

			// Handle string literals
			if (char === '"' || char === '\'') {
				if (config.respectStrings && !inTemplateLiteral && !inRegex)
					inString = !inString;
				res += char;
				continue;
			}

			// Handle template literals
			if (char === '`') {
				if (config.respectTemplateLiterals && !inString && !inRegex)
					inTemplateLiteral = !inTemplateLiteral;
				res += char;
				continue;
			}

			// Handle regular expressions
			if (char === '/') {
				if (config.respectRegex && !inString && !inTemplateLiteral) {
					inRegex = !inRegex;
					res += char;
					continue;
				}
			}

			// Check for block scope
			if (char === '{')
				blockDepth++;
			else if (char === '}')
				blockDepth--;

			// Check for new line or semicolon to start a new statement
			if (char === '\n' || char === ';') {
				isNewStatement = true; // Reset for the start of a new statement
				res += char; // Append the new line or semicolon
				continue;
			}

			// Check for variable declaration only at the top-level block scope
			if (!inString && !inTemplateLiteral && !inRegex && blockDepth === 1) {
				if (code.slice(i, i + 3) === 'let') {
					res += `let ${letNamespace}.`;
					// Skip the `let` keyword
					i += 2;
					// We are not at the start of a new statement anymore
					isNewStatement = false;
					continue;
				}

				if (code.slice(i, i + 5) === 'const') {
					res += `const ${constNamespace}.`;
					// Skip the `const` keyword
					i += 4;
					// We are not at the start of a new statement anymore
					isNewStatement = false;
					continue;
				}

				// Check for `eval` function calls only at the top-level block scope
				if (code.slice(i, i + 4) === 'eval') {
					// Check if `eval` is being called as a standalone function
					let prevChar = res.trim().slice(-1);
					if (prevChar === '(' || res.trim() === '')
						// Replace eval with proxified `version`
						res += `${config.proxifiedEvalPropTree}(`;
					else `
`                        // Keep the original eval
					res += 'eval';
					i += 3;
					// We are not at the start of a new statement anymore
					isNewStatement = false;
					// Skip `eval`
					continue;
				}

				// Check for assignments to `location`
				if (script.slice(i, i + 8) === 'location' && script[i + 8] === '=') {
					res += `${config.locationNamespace}.location = `;
					// Skip `location =`
					i += 8;
					// We are not at the start of a new statement anymore
					isNewStatement = false;
					continue;
				}
			}

			// Append the current character to the result
			// We are not at the start of a new statement anymore
			isNewStatement = false;
			res += char;
		}

		return ok(res);
	}
};
