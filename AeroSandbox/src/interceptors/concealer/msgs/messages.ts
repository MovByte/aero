// TODO: Rename this to window.js and move it to concealer

import { APIInterceptor, ExposedContextsEnum } from "$types/apiInterceptors";

// Utility
import { afterPrefix } from "$intUtil/getProxyURL";

const apiInterceptors = [{
	proxyHandlers: {
		apply(_target, _that, args) {
			// @ts-ignore
			args[1] = eventInterceptor(...args);
			return Reflect.apply(_target, _that, args);
		},
	},
	globalProp: "addEventListener",
	exposedContexts: ExposedContextsEnum.window,
}, {
	proxyHandlers: {
		// FIXME: Breaks on Google
		apply(_target, _that, args) {
			let [data, origin] = args;

			if (origin !== "*") {
				args[1] = "*";

				data.origin = origin;
				args[0] = data;
			}

			return Reflect.apply(_target, _that, args);
		},
	},
	globalProp: "postMessage",
	exposedContexts: ExposedContextsEnum.window,
}];

for (const [eventName] of ["message", "messageerror", "storage", "hashchange"]) {
	const proxifier = listener => eventInterceptor(eventName, listener);
	apiInterceptors.push({
		proxifyGetter: (_ctx) => proxifier,
		proxifySetter: (_ctx) => proxifier,
		globalProp: `on${eventName}`,
		exposedContexts: ExposedContextsEnum.window,
	})
}

function eventInterceptor(type, listener) {
	// TODO: Do this in `storage.ts`
	if (type === "storage") {
		return (event: Event) => {
			if (event instanceof StorageEvent) {
				event.url = $aero.afterPrefix(event.url);

				// Ensure the event isn't a clear event
				if (event.key !== null) {
					const proxyKey = $aero.storageKey(event.key);

					if (proxyKey !== null) event.key = proxyKey;
				}
			}
			listener(event);
		};
	}
	//! TODO: Because of $aero.sandbox.eventInterceptors needing to be initalized by initApis all of the concealers must run last
	if ($aero.sandbox.eventInterceptors[type] !== undefined) {
		const eventInterceptorInfo = $aero.sandbox.eventInterceptors[type] as EventInterceptorInfo;
		return eventInterceptorInfo.interceptor;
	}

	return listener;
}


export default apiInterceptors as APIInterceptor[];
