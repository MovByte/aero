/** Concealers for methods that return `CSSStyleSheet` (shadow root stylesheets)
 * This file should be required into a bundle for AeroSandbox, so there are no exports
 *
 * @see {@link https://drafts.csswg.org/cssom/#dom-documentorshadowroot-stylesheets}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet#obtaining_a_stylesheet} - These explain all of the methods of obtaining `CSSStyleSheet`. TODO: Finish intercepting all of those revealers.
 */

import { afterPrefix } from "$util/getProxyURL";
import {
	type APIInterceptor,
	ExposedContextsEnum
} from "$types/apiInterceptors.d.ts";

// Proxy the getters for shadow root stylesheets

function getSheet(sheet: CSSStyleSheet): CSSStyleSheet {
	return new Proxy(sheet, {
		get(target, prop: keyof CSSStyleSheet) {
			if (prop === "href") {
				return afterPrefix(target.href);
			} else if (prop === "parentStyleSheet") {
				// Parent recursion
				const parentStyleSheet = target.parentStyleSheet;
				if (parentStyleSheet !== null)
					return getSheet(parentStyleSheet);
			}
			return target[prop];
		}
	});
}

// TODO: Inside of .xsl files spoof the conceal processing instructions nodes to hide their stylesheets
function getProcessingInstructionSheet(
	processingInstruction: ProcessingInstruction
): ProcessingInstruction {
	return new Proxy(processingInstruction, {
		get(target, prop: keyof ProcessingInstruction) {
			if (prop === "sheet") {
				const sheet = target.sheet;
				if (sheet !== null) return getSheet(sheet);
			}
			return target[prop];
		}
	});
}

export default {
	proxifyGetter(_ctx) {
		/** The concealedProperty */
		const ret =
			// Conceal each `CSSStyleSheet` from the `StyleSheetList`
			Array.from(document.styleSheets).map(getSheet);

		return ret;
	},
	globalProp: "document.styleSheets",
	conceals: [{
		what: "CSSStyleSheet.href",
		revealerType: {
			type: "url",
			reveals: "escapedUrl"
		}
	}],
	exposedContexts: ExposedContextsEnum.window
} as APIInterceptor;
