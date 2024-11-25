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
	// Permissions Policy emulation
	htmlRules.set(HTMLImageElement, {
		onAttrHandlers: {
			src: blockHandler("img-src")
		}
	});

	for (const autoplayElement of autoplayElements)
		htmlRules.set(autoplayElement, {
			onAttrHandlers: {
				autoplay: blockHandler("autoplay")
			}
		});
}