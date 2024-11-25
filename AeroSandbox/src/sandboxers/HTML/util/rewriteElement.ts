import htmlRules from "./shared/index";

// Utility
import rewriteSrc from "$util/src";
import rewriteHtmlSrc from "./htmlSrc";
import Cloner from "./Cloner";

const afterRewritten = new WeakMap<Element, boolean>();
const elContainer = new WeakMap<Element, Element>();

function set(el: Element, attr: string, val = "", backup = true): void {
	// Avoid rewriting the next time by marking it to not be rewritten
	if (afterRewritten.has(el)) {
		const isAfterRewritten = afterRewritten.get(el);
		if (isAfterRewritten === true) {
			afterRewritten.set(el, false);
			return;
		}
	}
	afterRewritten.set(el, true);

	const elBak = el.cloneNode(true);
	if (elBak instanceof Element) {
		el.setAttribute(attr, val);

		// Backup element (for Element hooks)
		if (backup) elContainer.set(el, elBak);
	}

	if ($aero.config.featureFlags.HTML_REWRITER_TYPE === "mutation_observer") {
		Object.defineProperty(el, attr, {
			// @ts-ignore
			get: Object.getOwnPropertyDescriptors(elBak).get,
			// @ts-ignore
			set: Object.getOwnPropertyDescriptors(el).set
		});
	}
}

export default function rewriteElement(
	el: Element | Element,
	attrName?: string
): Element {
	// Don't exclusively rewrite attributes or check for already observed elements
	const isNew = typeof attrName === "undefined";

	// Check if the element's classes are any from the ignore classes
	const elClassList = Array.from(el.classList);
	for (const elClass of elClassList)
		for (const ignoreClass of $aero.config.rewriters.html.ignoreClasses)
			if (elClass === ignoreClass) return el;

	if (isNew && "integrity" in el && el.integrity !== "") {
		const cloner = new Cloner(el);

		cloner.clone();
		cloner.cleanup();
	}

	// @ts-ignore
	for (const [elForRule, htmlRule] of htmlRules.entries())
		if (
			el instanceof elForRule && htmlRule.mustBeNew
				? isNew
				: true && attrName in htmlRule.onAttrHandlers
		) {
			const attrHandler = htmlRule.onAttrHandlers[attrName];
			if (attrHandler instanceof Function)
				set(el, attrName, attrHandler[attrName](el, attrName));
			else if (attrHandler === "rewrite-src")
				set(el, attrName, rewriteSrc(attrName));
			else if (attrHandler === "rewrite-html-src")
				set(el, attrName, rewriteHtmlSrc(el.getAttribute(attrName)));
		}

	// @ts-ignore
	if (typeof el.onload === "string")
		// @ts-ignore
		set(el, "onload", $aero.rewriters.js(el.getAttribute("onload")));
	// @ts-ignore
	if (typeof el.error === "string")
		// @ts-ignore
		set(el, "onerror", $aero.rewriters.js(el.getAttribute("onload")));
}
