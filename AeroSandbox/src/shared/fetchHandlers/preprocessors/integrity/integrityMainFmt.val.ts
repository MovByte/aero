/**
 * The integrity feature, enabled by feature flag `integrity`
 */

import { transform } from "@swc/core";

import fmtScriptWithCalc from "./fmtScriptWithCalc.val";
import classicScript from "./integrity.val";
import modScript from "./integrityMod.val";

/** Feature flags */
interface ValPassthrough {
	debug: boolean
}

/**
 * For classic scripts
 */
export default function integrityMainFmt({ debug }: ValPassthrough) {
	return {
		cacheable: !debug,
		code: `module.exports = \`${compileScript(fmtScriptWithCalc(classicScript))}\`;`
	}
}

/**
 * For module scripts
 */
export function integrityModFmt({ debug }: ValPassthrough): string {
	return {
		cacheable: !debug,
		code: `module.exports = \`${compileScript(fmtScriptWithCalc(modScript))}\`;`
	}
}

function compileScript(code: string): string {
	return transform(code, {
		jsc: {
			parser: {
				syntax: "typescript"
			},
			target: "esnext",
			minify: true
		}
	});
}