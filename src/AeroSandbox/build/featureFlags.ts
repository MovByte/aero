import createDefaultFeatureFlags from "../createDefaultFeatureFlags";
import type { htmlRewriterMode } from "../types/rewriters/html";

export interface FeatureFlags {
	/** @warning `custom_elements` is currently unsupported */
	supportedHtmlRewriterModes: htmlRewriterMode[];
	/** @warning currently unsupported */
	htmlUseIsAttr: boolean;
	/** @warning currently unsupported */
	htmlUseNavEvents: boolean;
	/** @warning currently unsupported */
	featureEmuSecureCtx: boolean;
	/**
	 * TODO: This will make the URL proceed after the hash, evading all peeping by extension filters.
	 * @warning currently unsupported */
	featureHashURL: boolean;
	errorLogAfterColon: string;
	debug: boolean;
}

export interface CtxType {
	debugMode: boolean;
}

export type createFeatureFlags = (ctx: CtxType) => FeatureFlags;
