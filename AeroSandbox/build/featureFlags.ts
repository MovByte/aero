import createDefaultFeatureFlags from "../createDefaultFeatureFlags";
import type { htmlRewriterMode } from "../types/rewriters/html";

export type fetchPublicSuffixPriorityType = "compile-time" | "run-time";

export interface FeatureFlags {
	/** @warning `custom_elements` is currently unsupported */
	supportedHtmlRewriterModes: htmlRewriterMode[];
	/** @warning currently unsupported */
	htmlUseIsAttr: boolean;
	/** @warning currently unsupported */
	htmlUseNavEvents: boolean;
	featureCorsEmulation: boolean;
	/** @warning currently unsupported */
	featureEmuSecureCtx: boolean;
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
	featureHashURL: boolean;
	errLogAfterColon: string;
	debug: boolean;
}

export interface CtxType {
	debugMode: boolean;
}

export type createFeatureFlags = (ctx: CtxType) => FeatureFlags;
