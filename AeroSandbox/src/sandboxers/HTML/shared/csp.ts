import { proxyLocation } from "$aero/src/shared/proxyLocation";

// TODO: Use policy.ts

// Gets the sources in the CSP with directive
function cspSrc(dir: string): string[] {
	const [sources] = $aero.sec.csp.match(new RegExp(`${dir} ([^;]*)`), "g");

	if (typeof sources === "undefined") return;

	return sources.split(" ");
}

// If CSP blocked
export default (dir: string): boolean => {
	const sources = cspSrc(dir);

	let blocked = false;

	if (sources) {
		let allowed = false;

		if (!sources.includes("'none'"))
			for (const source of sources) {
				if (proxyLocation().href.startsWith(source)) {
					allowed = true;
					break;
				}

				// TODO: Instead use matchWildcard for full accuracy
				const wc = source.split("*");

				if (
					// Wildcard found
					wc.length > 1 &&
					proxyLocation().href.startsWith(wc[0])
				) {
					allowed = true;
					break;
				}
			}

		if (!allowed) blocked = true;
	}

	return blocked;
};
