import createDefaultFeatureFlags from "../createDefaultFeatureFlags";
import type { htmlRewriterMode } from "../types/rewriters/html";

export type fetchPublicSuffixPriorityType = "compile-time" | "run-time";

export interface FeatureFlags {
	/** @warning `custom_elements` is currently unsupported and untested */
	supportedHtmlRewriterModes: htmlRewriterMode[];
	/** @warning currently unsupunsupported and untestedported */
	htmlUseIsAttr: boolean;
	/** @warning currently unsupported */
	htmlUseNavEvents: boolean;
	/** @warning currently unsupported and untested */
	htmlUseHrefEmulation: boolean;
	/** @warning currently unsupported and untested */
	htmlInterceptMediaStreams: boolean;
	/** @warning Prerendering requires a lot of rewrites and is only supported in Chromium; however, even in Chromium, it doesn't work on sites controlled by SWs like aero under normal operations @see https://developer.chrome.com/docs/web-platform/prerender-pages#:~:text=speculation%20rules%20are%20not%20supported%20for%20prefetch%20for%20pages%20controlled%20by%20service%20workers.%20we%20are%20working%20to%20add%20this%20support.%20follow%20this%20support%20service%20worker%20issue%20for%20updates.%20prerender%20is%20supported%20for%20service%20worker-controlled%20pages. It would only make sense to enable this when in server-only mode. This is also a draft standard. */
	supportSpeculation: boolean;
	/** @warning currently unsupported and untested */
	supportFrames: boolean;
	corsEmulation: boolean;
	/** @warning currently unsupported and untested */
	emuSecureCtx: boolean;
	/** Integrity emulation is extremely slow, because it blocks the main thread to syncronously run a `Promise`. Very few to no sites will use integrity emulation as a means to detect aero. */
	supportIntegrityEmu: boolean;
	fetchPublicSuffixPriority: fetchPublicSuffixPriorityType;
	/** Fall back to the other option. Realistically, you would only disable this if you want to have a minimal bundle size. */
	fetchPublicSuffixHaveFallback: boolean;
	publicSuffixApi: string;
	failedToFetchSuffixErrMsg: string;
	/**
	 * TODO: This will make the URL proceed after the hash, evading all peeping by extension filters.
	 * @warning currently unsupported */
	hashURL: boolean;
	errLogAfterColon: string;
	debug: boolean;
}

export interface CtxType {
	debugMode: boolean;
}

export type createFeatureFlags = (ctx: CtxType) => FeatureFlags;
