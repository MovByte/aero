import type { CtxType, FeatureFlags } from "./build/featureFlags.ts";

export default (ctx: CtxType) =>
	({
		supportedHtmlRewriterModes: [
			"mutation_observer",
			"custom_elements",
			"domparser",
			"sw_parser"
		],
		htmlUseIsAttr: false,
		htmlUseNavEvents: false,
		featureEmuSecureCtx: false,
		featureHashURL: false,
		errorLogAfterColon: ":\n\t",
		debug: ctx.debugMode
	}) as FeatureFlags;
