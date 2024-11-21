import { proxyLocation } from "$aero/src/shared/proxyLocation";

// Custom protocols
export default {
	get(scheme: string): string {
		return scheme.replace(
			new RegExp(`^(web+${$aero.sandbox.proxyLocation().origin}+)`),
			"web+"
		);
	},
	set(scheme: string): string {
		const split = scheme.split("web+");

		split.splice(1, 0, `${proxyLocation().origin}+`);

		return split.join("");
	}
};
