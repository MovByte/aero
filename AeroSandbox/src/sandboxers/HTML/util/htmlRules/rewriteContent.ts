/**
 * @module
 */

// Utility
import appendSearchParam from "$shared/appendSearchParama";
import Cloner from "./htmlRules/shared/Cloner";

// Rewriters
import rewriteSpeculationRules from "$shared/rewriteSpeculationRules";
import getCSPPolicyRules from "$src/security/csp/getPolicyRules";
import validateCSPPlain from "$src/security/csp/validateCrossOrigin";

export default function setRulesContentRewriters(htmlRules) {
	htmlRules.set(HTMLScriptElement, {
		mustBeNew: true,
		onAttrHandlers: {
			src: (el: HTMLScriptElement, newVal: string) => {
				if (allow("script-src")) {
					const url = new URL(newVal);

					const isMod = el.type === "module";

					const params = url.searchParams;

					if (CSP_EMULATION && getCSPPolicyRules("script-src").includes("unsafe-inline") && new URL(url).pathname === "javascript:")
						throw new Error("A CSP violation in script-src occured for the rule, unsafe-inline, because the script URL is a `javascript:` URL!");

					if (isMod)
						appendSearchParam(
							params,
							{
								searchParam: $aero.searchParamOptions.isModule,
								escapeKeyword: $aero.searchParamOptions.escapeKeyword
							},
							isMod.toString()
						);
					if (el.integrity)
						appendSearchParam(
							params,
							{
								searchParam: $aero.searchParamOptions.isModule,
								escapeKeyword: $aero.searchParamOptions.escapeKeyword
							},
							el.integrity
						);
					if (CSP_EMULATION) {
						appendSearchParam(
							params,
							{
								searchParam: $aero.searchParamOptions.isModule,
								escapeKeyword: $aero.searchParamOptions.escapeKeyword
							},
							JSON.stringify($aero.csp),
						)
					}

					return url.href;
				}
			},
			// @ts-ignore
			onCreateHandler: (el: HTMLScriptElement) => {
				if (SUPPORT_SPECULATION && typeof el.innerHTML === "string" &&
					el.innerHTML !== "" && el.type === "speculationRules") {
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
					// TODO: Support `wasm-unsafe-eval`
					// TODO: Support `strict-dynamic`
					if (CSP_EMULATION) {
						const cspRules = getCSPPolicyRules("script-src");
						if (!cspRules.includes("'unsafe-inline'")) {
							for (const cspRule of cspRules) {
								if (cspRule.startsWith("nonce-")) {
									const nonce = cspRule.replace("^nonce-", "");
									if (nonce !== el.nonce)
										$aero.logger.fatalErr("CSP violation in script-src occured for the rule, nonce!");
								}
								if (cspRule.startsWith("sha256-")) {
									/** This must be done synchronously because it is inside of a Custom Element */
									const validateHashSync = $aero.sandbox.extLib.syncify(validateHash);
									const hash = cspRule.replace(/^sha256-/, "");
									if (cspRules.includes("unsafe-inline") && !validateHashSync(hash, el.innerHTML))
										// Hash validation
										$aero.logger.fatalErr(`CSP violation occured (hash mismatch in script-src occured for the rule, unsafe-inline)!`);
									// SRI validation
									else if (hash !== el.integrity)
										$aero.logger.fatalErr("A SP violation in script-src occured for the rule, sha256 (SRI validation failed)!");
								}
							}
							if (cspRule.startsWith("sha384-")) {
								/** This must be done synchronously because it is inside of a Custom Element */
								const validateHashSync = $aero.sandbox.extLib.syncify(validateHash);
								const hash = cspRule.replace(/^sha384-/, "");
								if (cspRules.includes("unsafe-inline") && !validateHashSync(hash, el.innerHTML, "SHA-384"))
									// Hash validation
									$aero.logger.fatalErr("A hash mismatch occured in script-src (occured for the rule, unsafe-inline)!");
								else {
									// SRI validation
									if (hash !== el.integrity)
										$aero.logger.fatalErr("A CSP violation in script-src occured for the rule, sha384 (SRI validation failed)!");
								}
							}
							validateCSPPlain(cspRule, "script-src");
						}
					}
				}

				// FIXME: Fix safeText so that it could be used here
				el.innerHTML = $aero.js.rewriteScript(el.innerText, {
					isModule: el.type === "module"
				}, {

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