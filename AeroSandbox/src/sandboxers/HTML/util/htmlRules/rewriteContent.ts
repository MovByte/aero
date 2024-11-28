/**
 * @module
 */

// Utility
import appendSearchParam from "$shared/appendSearchParama";
import Cloner from "./htmlRules/shared/Cloner";

// Rewriters
import rewriteSpeculationRules from "$shared/rewriteSpeculationRules";

export default function setRulesContentRewriters(htmlRules) {
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
				if (SUPPORT_SPECULATION && typeof el.innerHTML === "string" &&
					el.innerHTML !== "" && && el.type === "speculationRules") {
					el.innerHTML = rewriteSpeculationRules(el.innerHTML);
				}
				else if (
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
					el.innerHTML = $aero.js.rewriteScript(el.innerText, {
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
}