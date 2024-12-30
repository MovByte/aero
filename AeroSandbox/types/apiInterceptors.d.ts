import type { overwriteRecordsType } from "$types/generic";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export type RevokableProxyRet = { proxy: any; revoke: () => void };
interface ProxifiedObjGeneratorCtxType {
	specialInterceptionFeatures?: InterceptionFeaturesEnum;
	// might be removed I will just replace the <proxyContext> in the entire JS file  I am importingproxyGlobalContext: string;
	overwriteRecords?: overwriteRecordsType;
	globalNamespace: string;
	this: any;
}
export type ProxifiedObjType = RevokableProxyRet | ProxifiedObjGenerator;
export type ProxifiedObjGenerator = (
	ctx: ProxifiedObjGeneratorCtxType
) => ProxifiedObjType;
export type StorageProxifiyObjGenerator = (
	cookieStoreId: string
) => ProxifiedObjType;
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
/** This is for trapping `get` */
export type ProxifiedGetter = (ctx: ProxifiedObjGeneratorCtxType) => any;
/** This is for trapping `get` */
export type ProxifySetter = (ctx: ProxifiedObjGeneratorCtxType & {
	/** The new value from the setter while trying to trap `set` */
	newVal?: string
}) => any;

type revealerType = {
	type: "URL",
	reveals: "ORIGIN" | "ESCAPED_URL" | "HOSTNAME" | "DOMAIN" | "REAL_PROTOCOL" | "REAL_URL"
};
type concealType = {
	what: string;
	revealerType
};
/** For origin isolators */
export type isolatesType = [
	// TODO: Write this
]
export type objectPropertyModifier = (
	ctx: ProxifiedObjGeneratorCtxType
) => void;


export enum URL_IS_ESCAPE {
	ORIGIN,
	ESCAPED_URL,
	HOSTNAME,
	DOMAIN,
	REAL_PROTOCOL,
	REAL_URL,
	ANY_URL
}
type EscapeTypeShared = {
	what: "URL_STRING"
	is: URL_IS
} | {
	targeting: "VALUE_PROXIFIED_OBJ",
	props_that_escape: {
		[key: string]: EscapeTypeShared
	}
}
type EscapeFixesProxifiedValue = EscapeTypeShared;
type EscapeFixesProxyHandler = {
	targeting: "API_PARAM",
	targetingParam: number,
	apiMethod: "add",
	escapeType: EscapeTypeShared;
}[];


export enum URL_IS_CONCEAL {
	ORIGIN,
	HOSTNAME,
	DOMAIN,
	PROTOCOL,
	FULL_URL,
	ANY_URL
}
// TODO: Do conceal now
type ConcealTypeShared = {
	what: "URL_STRING"
	is: URL_IS
} | {
	targeting: "VALUE_PROXIFIED_OBJ",
	props_that_conceal: {
		[key: string]: ConcealTypeShared
	}
}

type APIInterceptorGenericShared = {
	/** This object path that excludes global objects and overwrites the property. *AeroSandbox* will also check if it exists in the global context. This is necessary if `proxifiedObjWorkerVersion` is set.
	 * This is done so that if the api is only exposed to the window it will overwrite it on the window object specifically or else it would use self since that is also covered by the global context of windows and workers. THe reason why this is done is because I want an error to be thrown if a window API is mistakingly used in a worker's global scope.
	 * TODO: Throw an error in AeroSandboxBuilder error if globalProp contains "<global context>.<props>"
	 * NOTE: <proxyNamespace> is substituted with the proxyNamespace in the AeroSandboxConfig
	 * @warning It will overwrite the entire global scope with your proxified object if you set it to `""`.
	 */
	globalProp: string | "";
	isolates: isolatesType[];
	/** These toggle code inside of the Proxy handler that provide other things you may want to use AeroSandbox for */
	specialInterceptionFeatures?: InterceptionFeaturesEnum;
	/** This is if your API Interceptor covers WebSockets, WebTransports, or WebRTC */
	forAltProtocol?: AltProtocolEnum;
	/* Aero uses self.<apiName> to overwrite the proxified object, but if the API is exclusively for the window, it uses window.<apiName>. It assumes the API is supported in all contexts by default. */
	exposedContexts?: ExposedContextsEnum;
	supports?: SupportEnum;
	/** This number determines how late the API injectors will be injected. It is similar to the index property in CSS. If not set, the default is zero. */
	insertLevel?: number;
}
/** This is a generic type interface used for intersection in other interfaces below */
type APIInterceptorGeneric = {
	/** You must include this in every concealer in aero */
	conceals: concealType[];
} & APIInterceptorGenericShared | {
	escapeFixes: EscapeFixes
} & APIInterceptorGenericShared;
/** You use this when you haven't yet finished your implementation for your API and you want to skip it. If the Feature Flag DELETE_UNSUPPORTED_APIS is enabled, then it would delete the API instead of doing nothing. */
export type APIInterceptorSkip = APIInterceptorGeneric & {
	/** Please add a comment above setting this property explaining why you have decided to skip it */
	skip: true,
}
export type APIInterceptorForProxyObjects = APIInterceptorGeneric & {
	/** This is specifically for objects that use the ES6 Proxy Object or re-implement the API from scratch. proxifiedObjGenFunc is a handler which returns the proxified object depending on the context given, which is determined by how the AeroSandboxBundler class is configured with the config in the constructor.*/
	// biome-ignore lint/complexity/noBannedTypes: <explanation>
	proxifiedObj?: Object | ProxifiedObjGenerator;
	createStorageProxyHandlers: StorageProxifiyObjGenerator;
};
export type APIInterceptorForProxyObjectsInWorker = APIInterceptorGeneric & {
	// biome-ignore lint/complexity/noBannedTypes: <explanation>
	proxifiedObjWorkerVersion?: Object;
};
export type APIInterceptorForProxifiyingGettersAndSetters = APIInterceptorGeneric & {
	proxifiedGetter?: ProxifiedGetter;
	proxifySetter?: ProxifySetter;
};
export type APIInterceptorForModifyingObjectProperties =
	APIInterceptorGeneric & {
		/** This is for overwriting properties with the `Object` type class  */
		modifyObjectProperty: objectPropertyModifier;
	};
// TODO: Make it possible in AeroSandbox to view the API Interceptor and determine if it should be included in AeroSandbox or not with a handler
/** This is what is exported in every API Interceptor. Omitting any of the properties with the Enum type will act as if every member of the Enum is present. */
export type APIInterceptor =
	| APIInterceptorSkip
	| APIInterceptorForProxyObjects
	| APIInterceptorForProxyObjectsInWorker
	| APIInterceptorForProxifiyingGettersAndSetters
	| APIInterceptorForModifyingObjectProperties;

// TODO: Make something like SupportEnum, but instead you provide a browser string and it only includes API interceptors for the features supported by those browsers
// Support Enums
// These enums are inspired by the WebIDL spec
// biome-ignore lint/style/useEnumInitializers: <explanation>
export enum SupportEnum {
	deprecated,
	nonstandard,
	draft,
	shippingChromium,
	originTrialExclusive,
	/** In Firefox, Chromium, and WebKit */
	widelyAvailable // TODO: Start defining this enum in my API Interceptors accordingly
}
// biome-ignore lint/style/useEnumInitializers: <explanation>
export enum ExposedContextsEnum {
	dedicatedWorker,
	sharedWorker,
	audioWorklet,
	animationWorklet,
	layoutWorklet,
	sharedStorageWorklet,
	paintWorklet,
	serviceWorker,
	window
}
export type anyWorkerExceptServiceWorkerEnumMember =
	| ExposedContextsEnum.animationWorklet
	| ExposedContextsEnum.audioWorklet
	| ExposedContextsEnum.dedicatedWorker
	| ExposedContextsEnum.layoutWorklet
	| ExposedContextsEnum.paintWorklet
	| ExposedContextsEnum.sharedStorageWorklet
	| ExposedContextsEnum.sharedWorker;
export type anyWorkerEnumMember =
	| anyWorkerExceptServiceWorkerEnumMember
	| ExposedContextsEnum.serviceWorker;
// biome-ignore lint/style/useEnumInitializers: <explanation>
export enum AltProtocolEnum {
	wrtc,
	ws,
	wt
}
// biome-ignore lint/style/useEnumInitializers: <explanation>
export enum InterceptionFeaturesEnum {
	/** This member requires the correct context to be passed down in the proxy's global context */
	corsEmulation,
	/** This member requires the correct context to be passed down in the proxy's global context */
	cacheEmulation,
	/** This feature is nowhere near being finished; **do not enable** */
	privacySandbox,
	/** Using this member adds code to the navigator.serviceWorker API interceptor to support nestedWorkers. If you enable it and don't have the supplementing SW code for it, it gives up on waiting for a message response back and throws an error. **/
	nestedSWs,
	/** This feature is nowhere near being finished; **do not enable** */
	swLess,
	aerogel,
	/** Only use this if you aren't using Custom Element "is" interception */
	elementConcealment,
	errorConcealment,
	messageIsolation,
	/** Only use this member if you aren't using it for a regular SW proxy */
	requestUrlProxifier
}

// Event stuff
export type eventListener = (event) => any;
export interface EventListener {
	type: "window",
	eventName: string;
	listener: eventListener;
}