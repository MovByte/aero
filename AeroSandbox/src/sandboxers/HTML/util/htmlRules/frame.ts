/**
 * @module
 * It is important to note that `iframe` element interception also contains some CORS Emulation
 */

// Utility
import { proxyLocation } from "$util/proxyLocation";
import block from "$cors/policy";

/**
 * @param htmlRules The rules Map to set the rules on
 */
export default function setRulesFrames(htmlRules) {
	const sec: {
		csp?: string;
		perms?: string;
		pr?: string;
	} = {};

	htmlRules.set(HTMLIFrameElement, {
		onAttrHandlers: {
			src(el: HTMLIFrameElement, newVal: string) {
				if (!block("frame-src")) return "";
				// Embed the origin as an attribute, so that the frame can reference it to do its checks
				// @ts-ignore
				el.contentWindow.$aero.frame.parentProxyOrigin =
					proxyLocation().origin;
				return newVal;
			},
			// Inject aero imports
			srcdoc: (_el: HTMLIFrameElement, newVal: string) => $aero.init + newVal,
			// Emulate CSP later
			csp(_el: HTMLIFrameElement, _newVal: string, oldVal: string) {
				if (FEATURE_CORS_EMULATION)
					// TODO: Implement
					return "";
				return "";
			},
			allow(_el: HTMLIFrameElement, _newVal: string, oldVal: string) {
				if (FEATURE_CORS_EMULATION)
					sec.perms = oldVal;
				return "";
			},
			allowPaymentRequest(
				_el: HTMLIFrameElement,
				_newVal: string,
				oldVal: string
			) {
				if (FEATURE_CORS_EMULATION)
					sec.pr = oldVal;
				return "";
			}
		},
		onCreateHandler(el: HTMLIFrameElement) {
			if (FEATURE_CORS_EMULATION)
				// @ts-ignore
				el.contentWindow.$aero.frame.sec = JSON.stringify(sec);
		}
	});
	// @ts-ignore: Very experimental
	htmlRules.set(HTMLPortalElement, {
		onAttrHandlers: {
			src: "rewrite-html-src"
		}
	});
}
