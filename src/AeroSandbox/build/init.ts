import type {
	APIInterceptor,
	proxifiedObjType,
	proxifiedObjGeneratorContext
} from "../types";

import type { htmlRewriterMode } from "../types/rewriters/html";

import { buildConfig } from "./customBuilds/aero";
//import { buildConfig as buildConfigFrakenUV } from "./customBuilds/frankenUV.inject.ts";

import { FeatureFlags } from "./featureFlags";

declare const HTML_REWRITER_MODE: htmlRewriterMode;

const proxifiedObjGenCtx: proxifiedObjGeneratorContext = {
	...buildConfig.specialInterceptionFeatures
};

/*
if (process.env.BUILD_UV_FRAKEN)
	proxifiedObjGenCtx = {
		...buildConfigFrakenUV.specialInterceptionFeatures
	};
	*/

if (process.env.BUILD_WOMBAT_SHIM) {
	// TODO: Build
}

type level = number;
const insertLater = new Map<level, proxifiedObjType>();

// @ts-ignore TODO: Move this code to AeroSandbox
const ctx = import.meta.webpackContext("../src/interceptors", {
	regExp: /\.ts$/
});
for (const fileName of ctx.keys()) {
	console.log(fileName);
	const aI: APIInterceptor = ctx(fileName);
	if (aI.insertLevel && aI.insertLevel !== 0)
		insertLater.set(aI.insertLevel, aI);
	else handleAI(aI);
}

// @ts-ignore
const sortedInsertObj = Object.entries(
	Array.from(insertLater.keys()).sort((a, b) => b[1] - a[1])
) as {
	[key: string]: APIInterceptor;
};

for (const aI of Object.values(sortedInsertObj))
	handleAI(aI);

function handleAI(aI: APIInterceptor): void {
	if (aI.exposedContexts) {
		if (Object.values(aI.exposedContexts).includes("window")) {
			// @ts-ignore
			if (aI.proxifiedObj) {
				const proxyObject = resolveProxifiedObj(
					// @ts-ignore
					aI.proxifiedObj,
					proxifiedObjGenCtx
				);

				window[aI.globalProp] = proxyObject;
			} // @ts-ignore
			else if (aI.proxifiedObjWorkerVersion) {
				Object.defineProperty(
					window,
					aI.globalProp,
					aI.proxifiedObjWorkerVersion
				);
			}
		}
	} else {
		// @ts-ignore
		if (aI.proxifiedObj) {
			const proxyObject = resolveProxifiedObj(
				// @ts-ignore
				aI.proxifiedObj,
				proxifiedObjGenCtx
			);

			self[aI.globalProp] = proxyObject;
		} // @ts-ignore
		else if (aI.proxifiedObjWorkerVersion) {
			Object.defineProperty(
				self,
				aI.globalProp,
				aI.proxifiedObjWorkerVersion
			);
		}
	}
}

function resolveProxifiedObj(
	proxifiedObj: proxifiedObjType,
	ctx: proxifiedObjGeneratorContext
): proxifiedObjType {
	let proxyObject = {};
	if (typeof proxifiedObj === "function") proxyObject = proxifiedObj(ctx);
	else if (typeof proxifiedObj === "object") proxyObject = proxifiedObj;
	return proxyObject;
}

// Run the HTML Interceptors as per the config
const supportedHTMLRewriterModes: string[] = JSON.parse(
	// @ts-ignore
	SUPPORTED_HTML_REWRITER_MODES
);

const preferredMode = config.FeatureFlags.HTML_REWRITER_MODE;
if (!supportedHTMLRewriterModes.includes(preferredMode)) {
	throw new Error(
		`This build of AeroSandbox does not support ${preferredMode}`
	);
}

// TODO: Delete all privacy sandbox APIs until bare-extended is finished and do that under the feature flag `DELETE_UNUSED_APIS` and recommend it for security. It would also delete the fenced frame element.

if (
	preferredMode === "mutation_observer" ||
	(preferredMode === "custom_elements" &&
		config.FeatureFlags.CUSTOM_ELEMENTS_USE === "mutation_observers")
)
	import("../src/sandboxers/HTML/adaptors/useMutationObservers.ts");
if (
	preferredMode === "domparser" ||
	(preferredMode === "custom_elements" &&
		config.FeatureFlags.CUSTOM_ELEMENTS_USE === "domparser")
)
	import("../src/sandboxers/HTML/adaptors/useDOMParser.ts");
if (
	preferredMode === "sw_parser" ||
	(preferredMode === "custom_elements" &&
		config.FeatureFlags.CUSTOM_ELEMENTS_USE === "sw_parser")
)
	import("../src/sandboxers/HTML/adaptors/useParser.ts");
if (preferredMode === "custom_elements")
	import("../src/sandboxers/HTML/adaptors/useCustomElements.ts");