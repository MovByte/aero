import { safeText } from "./tt";

import Cloner from "./Cloner";

// In the case of CORS attributes present the original is deleted and a new clone is made because it isn't possible to modify the CORS properties internally
export default class {
	el: HTMLElement;
	copy: HTMLElement;

	/**
	 * Clones an element without their read-only integrity attribute
	 * @constructor
	 * @param - The element to be cloned
	 */
	constructor(el: HTMLElement) {
		const copy = document.createElement(el.tagName);

		this.el = el;
		this.copy = copy;

		copy["observed"] = true;

		for (const name of el.getAttributeNames())
			if (name !== "integrity") copy[name] = el[name];

		if ("innerHTML" in el && el.innerHTML !== "")
			safeText(copy, el.innerHTML);
	}
	clone() {
		// Insert
		this.el.after(this.copy);
	}
	static deleteScript(script: HTMLElement) {
		if (script instanceof HTMLScriptElement) {
			// Disable old script by breaking the type so it doesn't run
			script.type = "_";

			safeText(script, "");
		}

		script.remove();
	}
	cleanup() {
		Cloner.deleteScript(this.el);
	}
}
