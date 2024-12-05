/**
 * @module
 * TODO: Write a description: ...
 */

import type {
	APIInterceptor,
	proxifiedObjGeneratorCtxType,
	proxifiedObjType,
} from "$types/apiInterceptors";

import type {
	default as ToBeDefined,
	toBeDefinedErrsType,
} from "$types/global";

import createApiInterceptorIteratorClient from "./createApiInterceptorIteratorClient";

import isAPIIncluded from "./isApiIncluded";

type level = number;

export default (
	requiredObjs: {
		// TODO: Define types
		proxyNamespaceObj: any;
		aeroSandboxNamespaceObj: any;
		featureConfig: any;
	},
	logger?,
	includeRegExp = /\.ts$/,
): {
	toBeDefinedErrs: toBeDefinedErrsType[];
	toBeDefined: ToBeDefined;
} => {
	// Unpack
	// We are assuming the user imports the logger bundle before AeroSandbox
	const { proxyNamespaceObj, aeroSandboxNamespaceObj } = requiredObjs;
	if (!logger) {
		logger = proxyNamespaceObj.logger;
	}

	const proxifiedObjGenCtx: proxifiedObjGeneratorCtxType = {
		...featureConfig.specialInterceptionFeatures,
	};

	const insertLater = new Map<level, proxifiedObjType>();

	const toBeDefinedErrs: toBeDefinedError[];
	const toBeDefined: ToBeDefined;
	for (const aI of createApiInterceptorIteratorClient(includeRegExp)) {
		try {
			const apiInterceptorName = aI.globalProp;
			if (isAPIIncluded(apiInterceptorName, featureConfig)) continue; // Should skip?
			if (DEBUG) {
				logger.debug(
					`Processing API interceptors from the file ${fileName} (${apiInterceptorName})`,
				);
			}
			if (aI.insertLevel && aI.insertLevel !== 0) {
				insertLater.set(aI.insertLevel, aI);
			} else {
				toBeDefinedErr = handleAI(
					aI,
					aeroSandboxNamespaceObj.toBeDefined,
					proxifiedObjGenCtx,
				);
				toBeDefinedErrs[apiInterceptorName] = toBeDefinedErrs;
			}
		} catch (err) {
			toBeDefinedErrs.push(err);
		}
	}

	const sortedInsertObj = Object.entries(
		Array.from(insertLater.keys()).sort((a, b) => b[1] - a[1]),
	) as {
		[key: string]: APIInterceptor;
	};

	for (const aI of Object.values(sortedInsertObj)) handleAI(aI, toBeDefined);

	return {
		toBeDefinedErrs,
		toBeDefined,
	};
};

// @ts-ignore
function handleAI(
	aI: APIInterceptor,
	toBeDefined: ToBeDefined,
	proxifiedObjGenCtx: proxifiedObjGeneratorCtxType,
): toBeDefinedError | "successful" { // @ts-ignore
	if (aI.proxifyGetter) {
		const newGetter = aI.proxifyGetter({
			this: toBeDefined.browsingContext[aI.globalProp],
		})
		Object.defineProperty(toBeDefined.browsingContext, toBeDefined.globalProp, {
			get: newGetter,
		});
		return "successful";
	}
	if (aI.proxifySetter) {
		Object.defineProperty(toBeDefined.browsingContext, toBeDefined.globalProp, {
			set(newVal) {
				const newSetter = aI.proxifySetter({
					this: toBeDefined.browsingContext[aI.globalProp],
					newVal
				});
				newSetter();
			},
		});
		return "successful";
	}
	if (aI.proxyHandlers) {
		toBeDefined.browsingContext[aI.globalProp] = Proxy.revocable(toBeDefined.browsingContext[aI.globalProp], aI.proxyHandlers)
		return "successful";
	}
	if (aI.proxyHandlersWorkersVersion) {
		toBeDefined.browsingContext[aI.globalProp] = Proxy.revocable(toBeDefined.browsingContext[aI.globalProp], aI.proxyHandlersproxyHandlersWorkersVersion)
		return "successful";
	}
}

function resolveProxifiedObj(
	// @ts-ignore
	proxifiedObj: proxifiedObjType,
	// @ts-ignore
	ctx: proxifiedObjGeneratorCtxType,
	// @ts-ignore
): proxifiedObjType {
	let proxyObject = {};
	if (typeof proxifiedObj === "function") proxyObject = proxifiedObj(ctx);
	else if (typeof proxifiedObj === "object") proxyObject = proxifiedObj;
	return proxyObject;
}
