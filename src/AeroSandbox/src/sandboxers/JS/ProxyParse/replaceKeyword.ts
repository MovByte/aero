/**
 * @module
 * Methods in this module are meant to be used with `keywordGenerator.ts` or iterator design like that, but they may be used however you like
*/

/**
 * This method does the same thing as `replaceVarAssignmentKeyword` here, but it wraps around the replacement keywords for you given the fakeVarNamespace;
 * consider it a helper method for `replaceVarAssignmentKeyword`.
 * This method was designed around the fake vars in a jail system, but may be used however you like.
 *
 * @example
 * // This example is specifically taken from AeroGel:
 * const letNamespace = "...(you define this)";
 *
 * let res = "";
 * const iterator = processKeyword(script, config);
 *
 * for (let { char, i, blockDepth = 0, inNewStatement = false } of iterator) {
 *  // Rewrite `let`, `const`, `eval`, and `location` only at the start of a new statement
 *  if (blockDepth === 1 && inNewStatement) {
 *   // Rewrite `let` with the fake var namespace from the config provided in this class
 *   {
 *    const { newRes, shouldContinue } = replaceVarAssignmentKeywordWithFakeVarNamespace(iterator, i, script, res, "let", letNamespace);
 *    res = newRes;
 *    if (shouldContinue) continue;
 *   }
 *  }
 *  ...
 * }
 */
export function replaceVarAssignmentKeywordWithFakeVarNamespace(iterator: Iterator, i: number, script: string, res: string, varAssignmentKeyword: varAssignmentKeywords, fakeVarNamespace: string): ReturnTypeForVarAssignmentKeywordReplacement {
	return replaceVarAssignmentKeyword(iterator, i, script, res, varAssignmentKeyword, `let ${fakeVarNamespace}.`);
}

/**
 * This method allows you to replace the variable type keyword
 * (e.g. `let` to `var` or `let` to `const`)
 */
export function replaceVarAssignmentKeyword(iterator: Iterator, i: number, script: string, res: string, varAssignmentKeyword: varAssignmentKeywords, replacement: string): ReturnTypeForVarAssignmentKeywordReplacement {
	let newRes = res;
	if (script.slice(i, varAssignmentKeyword.length) === varAssignmentKeyword) {
		newRes += replacement;
		// Skip the keyword by going next from the amount of chars after the first letter of the keyword
		for (const _ of Array.from({ length: varAssignmentKeyword.length - 1 })
            iterator.next();
		return {
			newRes,
			shouldContinue: true
		};
	}
	return {
		newRes,
		shouldContinue: false
	};
}

/**
 * This method allows you to replace the method being called
 * (e.g. `eval` to `_eval`)
 *
 * @example
 * // This example is specifically taken from AeroGel:
 * const proxifiedEvalPropTree = "...(you define this)";
 * let res = "";
 * const iterator = processKeyword(script, config);
 *
 * for (let { char, i, blockDepth = 0, inNewStatement = false } of iterator) {
 *  // Rewrite `let`, `const`, `eval`, and `location` only at the start of a new statement
 *  if (blockDepth === 1 && inNewStatement) {
 *   / Rewrite `eval` with the proxified version of it if it is in a module script
 *   if (this.config.isModule) {
 *    const { newRes, shouldContinue } = replaceMethod(iterator, i, script, res, "eval", proxifiedEvalPropTree);
 *    res = newRes;
 *    if (shouldContinue) continue;
 *   }
 *  }
 *  ...
 * }
 */
export function replaceMethod(iterator: Iterator, i: number, script: string, res: string, methodName: string, replacement: string): ReturnTypeForVarAssignmentKeywordReplacement {
	let newRes = res;
	if (script.slice(i, i + 4) === methodName && (res.trim().slice(-1) === '(' || res.trim() === '')) {
		newRes += `${replacement}(`;

		// Skip the keyword by going next from the amount of chars after the first letter of the keyword
		for (const _ of Array.from({ length: methodName.length - 1 })
            iterator.next();

		return {
			newRes,
			shouldContinue: true
		};
	}
	return {
		newRes,
		shouldContinue: false
	};
}

/**
 * This method allows you to replace the the variable that is being assigned to
 * (e.g. `x = ...` to `y = ...`)
 *
 * @example
 * // This example is specifically taken from AeroGel:
 * const proxifiedEvalPropTree = "...(you define this)";
 * let res = "";
 * const iterator = processKeyword(script, config);
 *
 * for (let { char, i, blockDepth = 0, inNewStatement = false } of iterator) {
 *  // Rewrite `let`, `const`, `eval`, and `location` only at the start of a new statement
 *  if (blockDepth === 1 && inNewStatement) {
 *   // Intercept the `location = ...` assignment and rewrite it to `<locationNamespace>.location = ...` to prevent a no-op
 *   {
 *    const { newRes, shouldContinue } = replaceAssignmentKeyword(iterator, i, script, res, "location", this.config.locationNamespace);
 *    res = newRes;
 *    if (shouldContinue)
 *     continue;
 *   }
 *  }
 *  ...
 * }
 */
function replaceAssignmentKeyword(iterator: Iterator, i: number, script: string, res: string, keyword: string, replacement: string): ReturnTypeForVarAssignmentKeywordReplacement {
	let newRes = res;
	if (script.slice(i, keyword.length) === keyword && script[i + keyword.length] === '=') {
		newRes += `${replacement}.location = `;
		// Skip the keyword by going next from the amount of chars after the first letter of the keyword
		for (const _ of Array.from({ length: keyword.length - 1 })
            iterator.next();
		return {
			newRes,
			shouldContinue: true
		};
	}
	return {
		newRes,
		shouldContinue: false
	};
}

export interface ReturnTypeForVarAssignmentKeywordReplacement {
	/** What the new value of `res` should be after we do these replacements */
	newRes: string,
	/** If you should `continue` to pass to the next iteration of the loop */
	shouldContinue: boolean
}

export type varAssignmentKeywords = "var" | "let" | "const";