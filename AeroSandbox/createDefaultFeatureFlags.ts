import type { CtxType, FeatureFlags } from "./build/featureFlags.js";

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
		htmlUseHrefEmulation: false,
		htmlInterceptMediaStreams: false,
		supportFrames: false,
		supportSpeculation: false,
		corsEmulation: false,
		emuSecureCtx: false,
		hashURL: false,
		supportIntegrityEmu: false,
		fetchPublicSuffixPriority: "compile-time",
		fetchPublicSuffixHaveFallback: true,
		publicSuffixApi: "https://publicsuffix.org/list/public_suffix_list.dat",
		failedToFetchSuffixErrMsg: "Failed to fetch the public suffixes list for use in determining if the two URLs are the same site",
		errLogAfterColon: ":\n\t",
		debug: ctx.debugMode
	}) as FeatureFlags;
