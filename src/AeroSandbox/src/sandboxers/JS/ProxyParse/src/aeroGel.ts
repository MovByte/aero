/**
 * @module
 * Methods in this module are meant to be used with `keywordGenerator.ts` or iterator de e used however you like.
 * You can find this module on `aero-sandbox/proxy-parse-ts/replaceKeyword` on *NPM* or *JSR*
*/

import type { varAssignmentKeywords, ReturnTypeForVarAssignmentKeywordReplacement } from ".";

import type { keywordIterator } from ".";

/**
 * This method does the same thing as `replaceVarAssignmentKeyword` here, but it wraps around the replacement keywords for you given the fakeVarNamespace;
 * consider it a helper method for `replaceVarAssignmentKeyword`.
 * This method was designed around the fake vars in a jail system, but may be used however you like.
 * @param iterator The iterator from `processKeyword`
 * @param i The current index of the script as being processed by the iterator
 * @param script The script being processed by the iterator'
 * @param res The characters that have currently been accumulated to the point of reaching this function
 * @param varAssignmentKeyword The keyword to replace (e.g. `var`, `let`, `const`)
 * @param fakeVarNamespace The fake var namespace to replace the keyword with (e.g. `var`, `let`, `const`)
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
export function replaceVarAssignmentKeywordWithFakeVarNamespace(iterator: keywordIterator, i: number, script: string, res: string, varAssignmentKeyword: varAssignmentKeywords, fakeVarNamespace: string): ReturnTypeForVarAssignmentKeywordReplacement {
    return replaceVarAssignmentKeyword(iterator, i, script, res, varAssignmentKeyword, `let ${fakeVarNamespace}.`);
}

/**
 * This method allows you to replace the variable type keyword
 * (e.g. `let` to `var` or `let` to `const`)
 * @warning This method is not meant to be used directly, but rather through `replaceVarAssignmentKeywordWithFakeVarNamespace`. It is only exported in case you really need it for your own implementation.
 * @param iterator The iterator from `processKeyword`
 * @param i The current index of the script as being processed by the iterator
 * @param script The script being processed by the iterator
 * @param res The characters that have currently been accumulated to the point of reaching this function
 * @param varAssignmentKeyword The keyword to replace (e.g. `var`, `let`, `const`)
 * @param replacement The replacement for the keyword (e.g. `var`, `let`, `const`)
 *
 * @example
 * // This example was taken from AeroGel and shows it in a jail scenario:
 * import processKeyword from "../ProxyParse/keywordGenerator";
 *
 * //...(define `script` and `locationNamespace` accordingly)
 *
 * let res = "";
 * const iterator = processKeyword(script, {});
 *
 * for (let { i } of iterator) {
 *  {
 *   const { newRes, shouldContinue } = replaceAssignmentKeyword(iterator, i, script, res, "location", locationNamespace);
 *   res = newRes;
 *   if (shouldContinue)
 *    continue;
 *  }
 * }
 */
export function replaceVarAssignmentKeyword(iterator: keywordIterator, i: number, script: string, res: string, varAssignmentKeyword: varAssignmentKeywords, replacement: string): ReturnTypeForVarAssignmentKeywordReplacement {
    let newRes = res;
    if (script.slice(i, varAssignmentKeyword.length) === varAssignmentKeyword) {
        newRes += replacement;
        // Skip the keyword by going next from the amount of chars after the first letter of the keyword
        for (const _ of Array.from({ length: varAssignmentKeyword.length - 1 }))
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
 * ...(define isModule)
 * const proxifiedEvalPropTree = "...(you define this)";
 * let res = "";
 * const iterator = processKeyword(script, config);
 *
 * for (let { char, i, blockDepth = 0, inNewStatement = false } of iterator) {
 *  // Rewrite `let`, `const`, `eval`, and `location` only at the start of a new statement
 *  if (blockDepth === 1 && inNewStatement) {
 *   / Rewrite `eval` with the proxified version of it if it is in a module script
 *   if (isModule) {
 *    const { newRes, shouldContinue } = replaceMethod(iterator, i, script, res, "eval", proxifiedEvalPropTree);
 *    res = newRes;
 *    if (shouldContinue) continue;
 *   }
 *  }
 * }
 */
export function replaceMethod(iterator: keywordIterator, i: number, script: string, res: string, methodName: string, replacement: string): ReturnTypeForVarAssignmentKeywordReplacement {
    let newRes = res;
    if (script.slice(i, i + 4) === methodName && (res.trim().slice(-1) === '(' || res.trim() === '')) {
        newRes += `${replacement}(`;

        // Skip the keyword by going next from the amount of chars after the first letter of the keyword
        for (const _ of Array.from({ length: methodName.length - 1 }))
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
 * ...(define locationNamespace)
 * const proxifiedEvalPropTree = "...(you define this)";
 * let res = "";
 * const iterator = processKeyword(script, config);
 *
 * for (let { char, i, blockDepth = 0, inNewStatement = false } of iterator) {
 *  // Rewrite `let`, `const`, `eval`, and `location` only at the start of a new statement
 *  if (blockDepth === 1 && inNewStatement) {
 *   // Intercept the `location = ...` assignment and rewrite it to `<locationNamespace>.location = ...` to prevent a no-op
 *   {
 *    const { newRes, shouldContinue } = replaceAssignmentKeyword(iterator, i, script, res, "location", locationNamespace);
 *    res = newRes;
 *    if (shouldContinue)
 *     continue;
 *   }
 *  }
 *  ...
 * }
 */
export function replaceAssignmentKeyword(iterator: keywordIterator, i: number, script: string, res: string, keyword: string, replacement: string): ReturnTypeForVarAssignmentKeywordReplacement {
    let newRes = res;
    if (script.slice(i, keyword.length) === keyword && script[i + keyword.length] === '=') {
        newRes += `${replacement}.location = `;
        // Skip the keyword by going next from the amount of chars after the first letter of the keyword
        for (const _ of Array.from({ length: keyword.length - 1 }))
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
