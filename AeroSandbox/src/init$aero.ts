import { z } from "zod";

import BareClient from "@mercuryworkshop/bare-mux";

// Sanity check
if (!("$aero" in window)) {
	const err = "Unable to initalize $aero";
	console.error(err);
	document.write(err);
}

// TODO: Do this in the config
$aero.bc = new BareClient();

// For API Interceptors
/// For performance timing
$aero.resInfo = new Map<string, boolean>();

// Protect from overwriting, in case $aero scoping failed
Object.freeze($aero);
