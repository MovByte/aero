/**
 * @module
 */

// Utility
import blockHandler from "./util/handlers";

/** Elements that have the `autoplay` attribute that needs to be intercepted */
const autoplayElements = [HTMLAnchorElement, HTMLAreaElement, HTMLBaseElement];
Object.freeze(autoplayElements);

/**
 * @param htmlRules The rules Map to set the rules on
 */
export default function setRulesCORS(htmlRules) {
	// Permissions Policy and Content Security Policy (CSP) emulation
	/**
	 * Permission Policy Directives: @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy#directives'
	 *
	 */

	htmlRules.set(HTMLImageElement, {
		onAttrHandlers: {
			src: {
				ppBlock: "img-src"
			}
		},
		cspSrcBlock: "img-src"
	});

	for (const autoplayElement of autoplayElements)
		htmlRules.set(autoplayElement, {
			onAttrHandlers: {
				autoplay: {
					/** @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy/autoplay */
					ppBlock: "autoplay"
				}
			}
		});
}