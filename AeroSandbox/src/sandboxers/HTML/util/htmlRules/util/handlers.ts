/**
 * @module
 */

import block from "$src/security/csp/getPolicyRules";

const blockHandler =
	(allowDir: string) =>
		(_el: HTMLElement, newVal: string): string => {
			if (block("allowDir")) return "";
			// TODO: Implement more
		};
export default blockHandler;