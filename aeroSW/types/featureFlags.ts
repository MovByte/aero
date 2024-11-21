export interface FeatureFlags {
    /** @warning currently unsupported */
    featureUrlEnc: boolean;
    featureCorsTesting: boolean;
    /** @warning currently unsupported */
    featureCorsEmulation: boolean;
    /** @warning currently broken */
    FEATURE_INTEGRITY_EMULATION: boolean;
    /** @warning currently unsupported */
    featureEncBodyEmulation: boolean;
    featureCachesEmulation: boolean;
    featureClearEmulation: boolean;
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
