import rewriteSrc from "$aero/src/shared/src";
import type { onAttrHandler } from "$aero/types/htmlRules";
// TODO: Use $shared
import htmlSrc from "../shared/htmlSrc";

import proxifyCustomElementName from "../shared/proxifyCustomElementName";

import htmlRules from "../shared/htmlRules";

{
	for (const [OriginalHTMLElement, htmlRule] of htmlRules.entries()) {
		let observeAttributesArray: string[] = [];
		customElements.define(
			proxifyCustomElementName(htmlRule.tagName),
			// @ts-ignore
			class ProxifiedElement extends OriginalHTMLElement {
				constructor() {
					super();
					observeAttributesArray = Object.keys(
						htmlRule.onAttrHandlers
					);
				}
				attributeChangedCallback(attrName, _oldVal, newVal) {
					const handler = htmlRule.onAttrHandlers[attrName];
					if (handler) {
						const rewriteHandler =
							htmlRule.onAttrHandlers[attrName];
						let actualRewriteHandler: onAttrHandler;
						if (rewriteHandler === "rewrite-src")
							actualRewriteHandler = (newVal: string) => {
								return rewriteSrc(newVal);
							};
						else if (rewriteHandler === "rewrite-html-src")
							actualRewriteHandler = (newVal: string) => {
								return htmlSrc(newVal);
							};
						else actualRewriteHandler = rewriteHandler[attrName];
						super.setAttribute(
							attrName,
							// @ts-ignore
							actualRewriteHandler(newVal)
						);
					}
				}
				static get observeAttributes() {
					return observeAttributesArray;
				}
			},
			{
				extends: htmlRule.tagName
			}
		);
	}
}

// "is" appending with Custom Elements
// You can also use a Mutation Observer. TODO: I will make a flag so that you can choose which method you prefer.
// TODO: On the SW wrap the site content with `$aero.config.htmlSandboxElementName`
{
	const alreadyRewrittenChildren = new WeakSet<Element>();
	class HTMLSandbox extends HTMLDivElement {
		connectedCallback() {
			for (const child of super.children) {
				if (!alreadyRewrittenChildren.has(child)) {
					for (const [
						OriginalHTMLElement,
						htmlRule
					] of htmlRules.entries()) {
						if (
							// @ts-ignore
							child instanceof OriginalHTMLElement &&
							// Parity check
							htmlRule.tagName === child.tagName
						)
							child.setAttribute(
								"is",
								proxifyCustomElementName(child.tagName)
							);
					}
					alreadyRewrittenChildren.add(child);
				} else {
					// Toggle
					alreadyRewrittenChildren.delete(child);
				}
			}
		}
	}
	customElements.define($aero.config.htmlSandboxElementName, HTMLSandbox);
}
