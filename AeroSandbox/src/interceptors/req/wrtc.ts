import {
	AltProtocolEnum,
	type APIInterceptor,
	ExposedContextsEnum
} from "$types/apiInterceptors.d.ts";

import escape from "$shared/escaping/escape";

export default {
	proxyHandlers: {
		construct(target, args) {
			const [config] = args;

			// Backup
			const iceServersBak = config.iceServers;

			if (config.iceServers && config.wrtcBackends.length > 0) {
				config.iceServers = config.wrtcBackends;
				args[0] = config;
			}

			const ret = new target(...args);

			ret["_iceServers"] = iceServersBak;

			return ret;
		},
		get(target, prop) {
			return typeof prop === "string" && escape("iceServers").test(prop)
				? target[`_${prop}`]
				: Reflect.get(target, prop);
		},
		set(target, prop, value) {
			if (typeof prop === "string" && escape("iceServers").test(prop)) {
				target[`_${prop}`] = value;
				return true;
			}
			return Reflect.set(target, prop, value);
		}
	},
	globalProp: "RTCPeerConnection",
	forAltProtocol: AltProtocolEnum.wrtc,
	exposedContexts: ExposedContextsEnum.window
} as APIInterceptor;
