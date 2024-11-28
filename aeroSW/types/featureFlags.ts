export interface FeatureFlags {
	/** @warning currently unsupported */
	urlEnc: boolean;
	corsTesting: boolean;
	/** @warning currently unsupported */
	corsEmulation: boolean;
	/** @warning currently broken */
	integrityEmulation: boolean;
	/** @warning currently unsupported */
	encBodyEmulation: boolean;
	cachesEmulation: boolean;
	clearEmulation: boolean;
	/** @warning Prerendering requires a lot of rewrites and is only supported in Chromium; however, even in Chromium, it doesn't work on sites controlled by SWs like aero under normal operations @see https://developer.chrome.com/docs/web-platform/prerender-pages#:~:text=speculation%20rules%20are%20not%20supported%20for%20prefetch%20for%20pages%20controlled%20by%20service%20workers.%20we%20are%20working%20to%20add%20this%20support.%20follow%20this%20support%20service%20worker%20issue%20for%20updates.%20prerender%20is%20supported%20for%20service%20worker-controlled%20pages. It would only make sense to enable this when in server-only mode. This is also a draft standard. */
	supportSpeculation: boolean;
	rewriterHtml: boolean;
	/** @warning currently unsupported */
	rewriterXslt: boolean;
	rewriterJs: boolean;
	/** @warning currently unsupported */
	rewriterJsMap: boolean;
	rewriterCacheManifest: boolean;
	supportLegacy: boolean;
	/** @warning currently unsupported */
	supportWorker: boolean;
	debug: boolean;
	errLogAfterColon: string;
}

/** Used exclusively for the overrides */
export interface FeatureFlagsRspack extends FeatureFlags {
	/* Defaults to what is in the build config if this is not set */
	serverOnly: "winterjs" | "cf-workers" | "false";
	/* Defaults to what is in the build config if this is not set. Referrer should be used in environments outside of a SW */
	reqInterceptionCatchAll: "referrer" | "clients";
}

/** Used exclusively for the overrides. Makes a copy of FeatureFlagsRspack, but all fields are optional. */
export type FeatureFlagsRspackOptional = Partial<FeatureFlagsRspack>;

export interface FeatureFlagsRuntime extends FeatureFlags { }
