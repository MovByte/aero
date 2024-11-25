import type { htmlRule } from "$aero/types/htmlRules";

import allow from "./csp";
import Cloner from "./Cloner";

import appendSearchParam from "$shared/appendSearchParam";
import block from "$cors/policy";

import rewriteSrc from "$shared/src";

import { proxyLocation } from "$aero/src/shared/proxyLocation";

// biome-ignore lint/suspicious/noExplicitAny: TODO: Make any Element
const htmlRules = new Map<any, htmlRule>();

const blockHandler =
	(allowDir: string) =>
		(_el: HTMLElement, newVal: string): string => {
			if (block("allowDir")) return "";
		};

// @ts-ignore
htmlRules.set(HTMLScriptElement, {
	mustBeNew: true,
	onAttrHandlers: {
		src: (el: HTMLScriptElement, newVal: string) => {
			if (allow("script-src")) {
				const url = new URL(newVal);

				const isMod = el.type === "module";

				const params = url.searchParams;

				appendSearchParam(
					params,
					$aero.searchParamOptions.isModule,
					isMod.toString()
				);

				if (isMod && el.integrity) {
					appendSearchParam(
						params,
						$aero.searchParamOptions.integrity,
						el.integrity
					);
				}

				return url.href;
			}
		},
		// @ts-ignore
		onCreateHandler: (el: HTMLScriptElement) => {
			if (
				!el.src &&
				typeof el.innerHTML === "string" &&
				el.innerHTML !== "" &&
				// Ensure the script has a JS type
				(el.type === "" ||
					el.type === "module" ||
					el.type === "text/javascript" ||
					el.type === "application/javascript")
			) {
				// FIXME: Fix safeText so that it could be used here
				el.innerHTML = $aero.z	js.rewriteScript(el.innerText, {
					isModule: el.type === "module"
				});

				// The inline code is read-only, so the element must be cloned
				const cloner = new Cloner(el);

				cloner.clone();
				cloner.cleanup();
			}
		}
	}
});

const linkElements = [HTMLAnchorElement, HTMLAreaElement, HTMLBaseElement];
Object.freeze(linkElements)
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

// @ts-ignore
htmlRules.set(HTMLPortalElement, {
	onAttrHandlers: {
		src: "rewrite-html-src"
	}
});

// Permissions Policy emulation
htmlRules.set(HTMLImageElement, {
	onAttrHandlers: {
		src: blockHandler("img-src")
	}
});
const autoplayElements = [HTMLAnchorElement, HTMLAreaElement, HTMLBaseElement];
Object.freeze(autoplayElements);
for (const autoplayElement of autoplayElements)
	htmlRules.set(autoplayElement, {
		onAttrHandlers: {
			autoplay: blockHandler("autoplay")
		}
	});

{
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
				// TODO: Bring back
			},
			// Inject aero imports
			srcdoc: (_el: HTMLIFrameElement, newVal: string) => $aero.init + newVal,
			// Emulate CSP later
			csp(_el: HTMLIFrameElement, newVal: string, oldVal: string) {
				return "";
			},
			allow(_el: HTMLIFrameElement, newVal: string, oldVal: string) {
				sec.perms = oldVal;
				return "";
			},
			allowPaymentRequest(
				_el: HTMLIFrameElement,
				_newVal: string,
				oldVal: string
			) {
				sec.pr = oldVal;
				return "";
			}
		},
		onCreateHandler(el: HTMLIFrameElement) {
			// @ts-ignore
			el.contentWindow.$aero.frame.sec = JSON.stringify(sec);
		}
	});
}

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

/*
For **HLS emulation** you could rewrite the `.mpd` manifest file in the SW, but then you would have to rewrite the URL to a proxy that is not a SW-handled-path, because all the major browsers have their own media pipeline, which has native browser code that bypasses the SW
*/
htmlRules.set(HTMLMetaElement, {
	onAttrHandlers: {
		src(el: HTMLIFrameElement, newVal: string) {
			if (newVal.endsWith(".m3u8") && (
				// @ts-ignore: The check `el.canPlayType("application/vnd.apple.mpegurl")` is for Safari only
				el.canPlayType("application/vnd.apple.mpegurl") ||
				// This check is for any browser
				$aero.sandbox.ext.Hls.isSupported())) {
				const hls = new $aero.sandbox.ext.Hls();
				hls.loadSource(newVal);
				hls.attachMedia(el);
			}
		}
	}
})
/*
For **MPEG-DASH emulation**, the situation is similar to **HLS emulation** when it comes to rewriting the `.m3u8` manifest file in the SW. 
*/
htmlRules.set(HTMLMetaElement, {
	onAttrHandlers: {
		src(el: HTMLIFrameElement, newVal: string) {
			if (newVal.endsWith(".mpd") ||
				// Check if the browser supports MPEG-DASH
				window.MediaSource && MediaSource.isTypeSupported("application/dash+xml")) {
				const dash = new $aero.sandbox.ext.dashjs.MediaPlayer();
				dash.initialize(el, newVal, true);
			}
		}
	}
});

export default htmlRules;
