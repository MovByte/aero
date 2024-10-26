import { z } from "zod";

import BareClient from "@mercuryworkshop/bare-mux";

$aero = z.object({
	init: z.string(),
	config: z.object({

	}),
	sandbox: z.object({
	})
})

/*
	init: string;
	sec: {
		csp: string;
	};
	bc: BareClient;
	logger: AeroSandboxLogger;
	config: Config;
	searchParamOptions: SearchParamOptionsConfig;
	rewriters: {
		js: JSRewriter;
	};
	*/

// Sanity check
if (!("$aero" in window)) {
	const err = "Unable to initalize $aero";
	console.error(err);
	document.write(err);
}

// TODO: Do this in the config
$aero.bc = new BareClient();

// Protect from overwriting, in case $aero scoping failed
Object.freeze($aero);
