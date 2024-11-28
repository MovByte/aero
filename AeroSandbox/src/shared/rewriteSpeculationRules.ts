/**
 * @module
 */

// Utility
import { getCSPPolicy } from "$src/security/csp/getPolicyRules"
import rewriteSrc from "$util/src";

/**
 * Rewrites the URLs in a speculation rules script
 * @script The script with a the attribute `speculationrules=true`
 * @see https://developer.chrome.com/docs/web-platform/prerender-pages#speculation-rules-api
 * @see https://wicg.github.io/nav-speculation/speculation-rules.html
 */
export default (script: string): string => {
	/** Don't rewrite (skip) if inline scripts are blocked, but speculation scripts aren't allowed */
	const scriptCSPRules = getCSPPolicy("inline-speculation-rules");
	if (!scriptCSPRules.includes('self') || scriptCSPRules.includes('unsafe-inline'))
		return script;

	const json = JSON.parse(script);
	if (json?.prerender?.urls)
		json.prerender.urls = json.prerender.urls.map((url: string) => {
			if (typeof url === "string")
				return rewriteSrc(url);
		});
	if (json?.prerender?.where)
		json.prerender.where = rewriteRule(json.prerender.where);
	return json;
}

/**
 * 
 * @param rulesObj The rules object to rewrite
 * @param insideAnd If a recursion was spawned by an `and` rule
 * @param insideNotIf a recursion was spawned by a `not` rule
 * This is a helper function meant to be for internal-use only, but it is exposed just in case you want to use it for whatever reason.
 */
export function rewriteRule(rulesObj: { [key: string]: string | typeof rulesObj }, insideAnd = false, insideNot = false) {
	for (const [ruleType, rule] of Object.entries(rulesObj)) {
		if (ruleType === "and" && typeof rule === "object" && !insideAnd)
			rewriteRule(rule, true, false);
		if (ruleType === "not" && typeof rule === "object" && !insideNot)
			rewriteRule(rule, false, true);
		if (ruleType === "href_matches")
			rulesObj[ruleType] = rewriteSrc(rule);
	}
}