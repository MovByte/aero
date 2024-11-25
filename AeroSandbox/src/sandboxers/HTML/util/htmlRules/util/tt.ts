/*
// I forgot what I was trying to do with this import
import {
	TrustedHTML,
	TrustedTypePolicy,
	TrustedTypesWindow
} from "trusted-types/lib";
*/

import config from "$aero/examples/config";

const { flags } = config;

// @ts-ignore
// biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
declare let trustedTypes;

// For Cors Emulation
const tt = trustedTypes.createPolicy("$aero", {
	createHTML: str => str,
	createScript: str => str
});

// A safe wrapper for text to comply with trusted types
const safeText = (el: HTMLElement, str: string) => {
	const isScript = el instanceof HTMLScriptElement;

	el.innerHTML = flags.corsEmulation
		? tt[isScript ? "createHTML" : "createScript"](str)
		: str;
};

export { tt, safeText };
