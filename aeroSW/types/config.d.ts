import type BareMux from "@mercuryworkshop/bare-mux";

import type { FeatureFlagsRuntime } from "$aero/types/featureFlags";
import type { SearchParamOptions } from "./catch-all";
import type { AeroSandboxFeaturesConfig } from "./aeroSandbox";

export type AeroPathFilter = (reqPath: string) => boolean;
/** @returns the encoded url */
export type URLEncoder = (url: string) => string;
/** @returns the decoded url */
export type URLDecoder = (encUrl: string) => string;

export interface SearchParamOptionsConfig {
	referrerPolicy: SearchParamOptions;
	isModule: SearchParamOptions;
	integrity: SearchParamOptions;
}
/**
 * This interface is used to define the configuration options for aero.
 */
export interface Config {
	bc: BareMux;
	/** aeroPathFilter: These files are excluded from import because they are needed for aero to function. */
	aeroPathFilter?: AeroPathFilter;
	/* This is useless if the Feature Flag UPDATE_SW_WHEN_ERR is disabled */
	pathToInitialSW: string;
	bundles: {
		handle: string;
		sandbox: string;
		config: string;
	};
	/** The prefix for the URL. */
	prefix: string;
	searchParamOptions: SearchParamOptionsConfig;
	/** The cache key to use. */
	cacheKey: string;
	/** The dynamic config configuration. */
	dynamicConfig?: {
		/** The database name. */
		dbName: string;
		/** Id to differentiate the message from other purposes. */
		id: string;
	};
	urlEncoder: URLEncoder;
	urlDecoder: URLDecoder;
	featureFlags: FeatureFlagsRuntime;
	featureConfig: AeroSandboxFeaturesConfig | "all";
}
