// Utility
import { proxyLocation } from "$src/shared/proxyLocation";

/**
 * 
 * @param cspRule The CSP rule to validate
 * @param checkOrigin The origin to validate against
 * @throws The emulated CSP policy violation
 */
export default function validateCSPPlain(cspRules: string | string[], src: string, directiveName: string): void {
	for (const cspRule of Array.isArray(cspRules) ? cspRules : [cspRules]) {
		const srcOrigin = new URL(src).origin;
		if (cspRule.startsWith("'self'")) {
			if (proxyLocation($aero.config.prefix, $aero.logger).origin !== new URL(src, proxyLocation($aero.config.prefix, $aero.logger).origin).origin)
				throw new Error(`CSP violation: Cross-origin request blocked when validating it for the directive ${directiveName} for the rule ${cspRule}`);
			continue;
		}
		if (cspRule.startsWith("http:") || cspRule.startsWith("https:")) {
			const protoToCheckAgainst = new URL(cspRule).protocol;
			const protoToCheck = new URL(src).protocol;
			if (protoToCheckAgainst === protoToCheck)
				baseErr(directiveName, `${cspRule} (protocol)`);
			continue;
		}
		if (cspRule.startsWith("'") || cspRule.endsWith("'")) {
			const originToCheckAgainst = csRule.slice(1, -1);
			if (srcOrigin !== originToCheckAgainst)
				baseErr(directiveName, `${cspRule} (custom origin)`);
			continue;
		}
	}
}

/**
 * This is a helper function meant to be for internal-use only, but it is exposed just in case you want to use it for whatever reason.
 */
export function baseErr(directiveName: string, cspRule: string) {
	throw new Error(`CSP violation: Cross-origin request blocked when validating it for the directive ${directiveName} for the rule ${cspRule}`);
}