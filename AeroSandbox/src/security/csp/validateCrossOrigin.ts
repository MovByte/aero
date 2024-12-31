// Utility
import { proxyLocation } from "$src/shared/proxyLocation";

/**
 * @param cspRule The CSP rule to validate
 * @param checkOrigin The origin to validate against
 * @throws {Error} The emulated CSP policy violation
 */
export default function validateCSPPlain(cspRules: string | string[], src: string, directiveName: string): void {
	for (const cspRule of Array.isArray(cspRules) ? cspRules : [cspRules]) {
		const srcOrigin = new URL(src).origin;
		if (cspRule.startsWith("'self'")) {
			if (proxyLocation().origin !== new URL(src, proxyLocation().origin).origin)
				throw fmtBaseErr(directiveName, cspRule);
			continue;
		}
		if (cspRule.startsWith("http:") || cspRule.startsWith("https:")) {
			const protoToCheckAgainst = new URL(cspRule).protocol;
			const protoToCheck = new URL(src).protocol;
			if (protoToCheckAgainst === protoToCheck)
				throw fmtBaseErr(directiveName, `${cspRule} protocol`);
			continue;
		}
		if (cspRule.startsWith("'") || cspRule.endsWith("'")) {
			const originToCheckAgainst = cspRule.slice(1, -1);
			if (srcOrigin !== originToCheckAgainst)
				throw fmtBaseErr(directiveName, `${cspRule} custom origin`);
			continue;
		}
	}
}

/**
 * This is a helper function meant for `validateCSPPlain` to format an error message
 * @param directiveName The directive name that caused an invalidation
 * @param cspRule The CSP rule that caused an invalidation
 * @return The emulated CSP policy violation Error
 */
function fmtBaseErr(directiveName: string, cspRule: string): Error {
	return new Error(`A CSP violation occured (Cross-origin request blocked when validating it for the directive ${directiveName} for the rule, ${cspRule})!`);
}