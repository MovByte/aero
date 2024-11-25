/**
 * @module
 */

import block from "$cors/policy";

const blockHandler =
	(allowDir: string) =>
		(_el: HTMLElement, newVal: string): string => {
			if (block("allowDir")) return "";
			// TODO: Implement more
		};
export default blockHandler;