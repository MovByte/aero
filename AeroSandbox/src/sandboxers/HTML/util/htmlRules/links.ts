/**
 * @module
 */

// Utility
import rewriteSrc from "$util/src";
import { proxyLocation } from "$shared/proxyLocation";

/**
 * The HTML elements that contain links that contain simple `href` attributes that need to be intercepted.
 */
const linkElements = [HTMLAnchorElement, HTMLAreaElement, HTMLBaseElement];
Object.freeze(linkElements)

/**
 * By "links" in the filename I mean any attribute that may result in a redirect. Because of this definition the meta refresh is also included.
 * @param htmlRules The rules Map to set the rules on
 */
export default function setRulesLinks(htmlRules) {
	for (const linkElement of linkElements)
		htmlRules.set(linkElement, {
			onAttrHandlers: {
				href: "rewrite-html-src"
			}
		});
	htmlRules.set(SVGAElement, {
		onAttrHandlers: {
			href: "rewrite-html-src",
			"xlink:href": "rewrite-html-src"
		}
	});
	htmlRules.set(HTMLFormElement, {
		onAttrHandlers: {
			action: "rewrite-html-src"
		}
	});

	htmlRules.set(HTMLMetaElement, {
		onAttrHandlers: {
			httpEquiv(el: HTMLMetaElement, newVal: string) {
				switch (newVal) {
					case "content-security-policy":
						return el.content;
					case "refresh":
						return el.content.replace(
							/^([0-9]+)(;)(\s+)?(url=)(.*)/g,
							(_match, g1, g2, g3, g4, g5) =>
								g1 +
								g2 +
								g3 +
								g4 +
								rewriteSrc(g5, proxyLocation().href)
						);
				}
			}
		}
	});

}