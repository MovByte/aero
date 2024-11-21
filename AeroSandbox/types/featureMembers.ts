import { InterceptionFeaturesEnum } from "./apiInterceptors.js";

// TODO: Put all of these terms in the API Interception Glossary

/** @note: These do not cover Origin Isolation although Origin Emulation is a type of Origin Isolation. Origin Emulation is a superset of Origin Isolation. */
const originEmulationFeatures =
	InterceptionFeaturesEnum.corsEmulation |
	InterceptionFeaturesEnum.cacheEmulation |
	InterceptionFeaturesEnum.privacySandbox |
	InterceptionFeaturesEnum.nestedSWs;
/** @note: These do not cover Origin Concealers although Origin Isolation is a type of Origin Concealing. Origin Isolation is a superset of Origin Concealment. */
const miscOriginIsolators = InterceptionFeaturesEnum.messageIsolation;
const miscOriginConcealers =
	InterceptionFeaturesEnum.elementConcealment |
	InterceptionFeaturesEnum.errorConcealment;
const defaultSWProxyFeatures = originEmulationFeatures | miscOriginConcealers;
const defaultProxyFeatures =
	defaultSWProxyFeatures | InterceptionFeaturesEnum.requestUrlProxifier;

export {
	originEmulationFeatures,
	miscOriginIsolators,
	miscOriginConcealers,
	defaultSWProxyFeatures,
	defaultProxyFeatures
};
