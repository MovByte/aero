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

const matchMetaRefreshVal = /^([0-9]+)(;)(\s+)?(url=)(.*)/g

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
						if (FEATURE_CORS_EMULATIO)
							for (const dir of el.content.split(";"))
								$aero.sec.csp.push(dir.trim());
					case "refresh":
						return el.content.replace(
							matchMetaRefreshVal,
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