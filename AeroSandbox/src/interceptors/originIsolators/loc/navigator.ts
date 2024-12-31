import {
	type APIInterceptor,
	ExposedContextsEnum,
	URL_IS_ESCAPE
} from "$types/apiInterceptors.d.ts";

import rewriteSrc from "$util/src";
import { proxyLocation } from "$shared/proxyLocation";
import proto from "$util/proto";
/**
 * The handler for the methods for registering (`navigator.registerProtocolHandler`) and unregistering (`unregisterProtocolHandler`) the protocols where the URL is for the protocol handler
 */
const sharedProtoHandler = {
	apply(target, that, args) {
		const [scheme, url] = args;
		args[0] = proto.set(scheme);
		args[1] = rewriteSrc(url, proxyLocation().href);
		return Reflect.apply(target, that, args);
	},
} as ProxyHandler<Navigator["registerProtocolHandler"]> | ProxyHandler<Navigator["unregisterProtocolHandler"]>;
/**
 * The escape fixes for the methods for registering (`navigator.registerProtocolHandler`) and unregistering (`unregisterProtocolHandler`) the protocols where the URL is for the protocol handler
 */
const sharedEscapeFixes = [
	{
		targeting: "param",
		targetingParam: 2,
		type: {
			what: "URL_STRING",
			type: URL_IS_ESCAPE.FULL_URL,
		},
	},
];

export default [
	{
		proxyHandler: {
			apply(target, that, args) {
				const [url] = args;
				args[0] = rewriteSrc(url, proxyLocation().href);
				return Reflect.apply(target, that, args);
			}
		} as ProxyHandler<Navigator["sendBeacon"]>,
		escapeFixes: [
			{
				targeting: "param",
				targetingParam: 1,
				type: {
					what: "URL_STRING",
					type: URL_IS_ESCAPE.FULL_URL,
				},
			},
		],
		globalProp: "navigator.prototype.sendBeacon",
		exposedContexts: ExposedContextsEnum.window
	},
	{
		proxyHandler: sharedProtoHandler,
		escapeFixes: sharedEscapeFixes,
		globalProp: "navigator.prototype.registerProtocolHandler",
		exposedContexts: ExposedContextsEnum.window
	},
	{
		proxyHandler: sharedProtoHandler,
		escapeFixes: sharedEscapeFixes,
		globalProp: "navigator.prototype.unregisterProtocolHandler",
		exposedContexts: ExposedContextsEnum.window
	}
] as APIInterceptor[];
