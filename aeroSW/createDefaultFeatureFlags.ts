import type { CtxType } from "../AeroSandbox/build/featureFlags";
import type { FeatureFlagsRspack } from "./types/featureFlags";

export default (ctx: CtxType) =>
	// @ts-ignore
	({
		urlEnc: false,
		corsTesting: false,
		corsEmulation: false,
		integrityEmulation: false,
		encBodyEmulation: false,
		cachesEmulation: false,
		clearEmulation: false,
		supportSpeculation: false,
		rewriterHtml: true,
		rewriterXslt: false,
		rewriterJs: false,
		rewriterCacheManifest: false,
		supportLegacy: false,
		supportWorker: false,
		reqInterceptionCatchAll: false,
		// Branding
		aeroBrandingInProd: true,
		// Feel free to change this default if you are making a fork of aero
		githubRepo: "https://github.com/vortexdeveloperlabs/aero",
		// Debug
		errLogAfterColon: JSON.stringify("\\n\\t"),
		debug: JSON.stringify(ctx.debugMode)
	}) as FeatureFlagsRspack;
