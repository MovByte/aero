import type { CtxType } from "./src/AeroSandbox/build/featureFlags";
import type { FeatureFlagsRspack } from "./types/featureFlags";

export default (ctx: CtxType) =>
	// @ts-ignore
	({
		featureUrlEnc: false,
		featureCorsTesting: false,
		featureCorsEmulationn: false,
		featureIntegrityEmulation: false,
		featureEncBodyEmulation: false,
		featureCachesEmulation: false,
		featureClearEmulation: false,
		rewriterHtml: true,
		rewriterXslt: false,
		rewriterJs: false,
		rewriterCacheManifest: false,
		supportLegacy: false,
		supportWorker: false,
		// Branding
		aeroBrandingInProd: true,
		// Feel free to change this default if you are making a fork of aero
		githubRepo: "https://github.com/vortexdeveloperlabs/aero",
		// Debug
		errLogAfterColon: JSON.stringify("\\n\\t"),
		debug: JSON.stringify(ctx.debugMode)
	}) as FeatureFlagsRspack;
