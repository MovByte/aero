/** @import { Config } from "aero-proxy" */

{
	/**
	 * @type {string}
	 */
	const escapeKeyword = "_";
	/**
	 * @type {string}
	 */
	const dirToAero = "/aero/";

	/**
	 * @type {Config}
	 */
	self.defaultAeroConfig = {
		globalNamespaceInject: "$aero",
		prefix: "/go/",
		// TODO: Change this accordingly on my fork of HU
		pathToInitialSW: "/sw.js",
		bundles: {
			"bare-mux": "/baremux/index.js",
			handle: `${dirToAero}sw.js`,
			aeroSandboxConfig: `${dirToAero}sandbox/config.js`,
			aeroSandbox: `${dirToAero}sandbox/sandbox.js`,
			logo: "/logo.svg"
		},
		aeroPathFilter: path =>
			Object.values(self.config.bundles).find(bundlePath =>
				path.startsWith(bundlePath)
			) === null ||
			path.startsWith("/tests/") ||
			path.startsWith("/baremux") ||
			path.startsWith("/epoxy/") ||
			!path.startsWith(aeroConfig.prefix),
		searchParamOptions: {
			referrerPolicy: {
				escapeKeyword,
				searchParam: "passthroughReferrerPolicy"
			},
			isModule: {
				escapeKeyword,
				searchParam: "isModule"
			},
			integrity: {
				escapeKeyword,
				searchParam: "integrity"
			}
		},
		cacheKey: "httpCache",
		dynamicConfig: {
			dbName: "aero",
			id: "update"
		},
		//urlEncoder: __uv$config.urlEncoder,
		//urlDecoder: __uv$config.urlDecoder,
		urlEncoder: url => url,
		urlDecoder: url => url,
		featureFlags: "all",
		dbTransactionTimeout: 2000,
	};
}
