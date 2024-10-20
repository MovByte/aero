import { boolFlag, type FeatureFlagsRspack } from "./types/featureFlags";

export default ctx =>
	// @ts-ignore
	({
		FEATURE_URL_ENC: boolFlag(false),
		FEATURE_CORS_TESTING: boolFlag(false),
		FEATURE_CORS_EMULATION: boolFlag(false),
		FEATURE_INTEGRITY_EMULATION: boolFlag(false),
		FEATURE_ENC_BODY_EMULATION: boolFlag(false),
		FEATURE_CACHES_EMULATION: boolFlag(false),
		FEATURE_CLEAR_EMULATION: boolFlag(false),
		REWRITER_HTML: boolFlag(true),
		REWRITER_XSLT: boolFlag(false),
		REWRITER_JS: boolFlag(false),
		REWRITER_CACHE_MANIFEST: boolFlag(false),
		SUPPORT_LEGACY: boolFlag(false),
		SUPPORT_WORKER: boolFlag(false),
		// Branding
		AERO_BRANDING_IN_PROD: boolFlag(true),
		// Feel free to change this default if you are making a fork of aero
		GITHUB_REPO: "https://github.com/vortexdeveloperlabs/aero",
		// Debug
		DEBUG: JSON.stringify(ctx.debugMode)
	}) as FeatureFlagsRspack;
