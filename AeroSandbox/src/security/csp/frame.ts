import { proxyLocation } from "$util/proxyLocation";

// Frame checks
/*
if (frameElement) {
	function block() {
		frameElement.remove();
	}

	const parentOrigin = frameElement.getAttribute("parentProxyOrigin");

	if (!parentOrigin)
		throw new Error("The parent's proxy origin wasn't given to the frame");

	const frameOptions = $aero.sec.headers.frame;

	if (frameOptions === "DENY") block();
	else if (frameOptions === "SAMEORIGIN") {
		if (proxyLocation().origin !== parentOrigin) block();
	} else if (csp.contains("frame-ancestors")) {
		const sources = $aero.csp.includes("frame-ancestors");

		if (sources.contains("'none'")) block();
		else {
			let allowed = false;

			for (const source of sources) {
				if (
					source === "'self'" &&
					parentOrigin === proxyLocation().origin
				) {
					allowed = true;
					break;
				}
				if (source === parentOrigin) {
					allowed = true;
					break;
				}
			}

			if (!allowed) block();
		}
	}
	// Still supported on Firefox mobile
	else if (
		flags.legacy &&
		frameOptions.startsWith("ALLOW-FROM=")
	) {
		const [allowedOrigin] = frameOptions.match(/ALLOW-FROM=(.+)/g);

		if (allowedOrigin) if (allowedOrigin !== parentOrigin) block();
	}
}
*/