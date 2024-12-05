import type { APIInterceptor, eventListener } from "$types/apiInterceptors.d.ts";

import { proxyLocation, upToProxyOrigin } from "$shared/proxyLocation";

// Prevent detection by instanceof or attempting to overwrite it
const inheritedObject = {};
Object.defineProperty(this, "inheritedObject", {
	writable: false,
	configurable: false
});
Reflect.setPrototypeOf(inheritedObject, Object.getPrototypeOf(location));

const wrap = (url: string) => $aero.config.prefix + url;

// TODO: PUT THIS BACK I ACCIDENTLY DELETED IT
const locationProxy = Proxy.revocable(inheritedObject, {
	get(target, prop) {
		function internal() {
			if (typeof target[prop] === "function") {
				// @ts-ignore
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				const props: any = {
					toString: () => proxyLocation().toString()
				};


				if (CORS_EMULATION)
					// TODO: Respect the `navigate-to` CSP directive from the passthrough CSP headers in `$aero.sec`...

					// These properties below are not defined in workers
					if ("assign" in location)
						props.assign = (url: string) =>
							location.assign(wrap(url));
				if ("replace" in location)
					props.replace = (url: string) =>
						location.replace(wrap(url));

				return prop in props && prop in location
					? props[prop]
					: target[prop];
			}

			const fakeUrl = proxyLocation;

			/**
			 * `ancestorOrigins` is only found in Chrome
			 */
			const customProps = {
				// TODO: Rewrite
				//ancestorOrigins: location.ancestorOrigins,
			};

			if (prop in customProps) return customProps[prop];

			if (prop in fakeUrl) return fakeUrl[prop];

			return location[prop];
		}

		const ret = internal();

		return ret;
	},
	set(target, prop, value) {
		if (
			prop === "pathname" ||
			(prop === "href" && value.startsWith("/"))
		)
			target[prop] = upToProxyOrigin + value;
		else target[prop] = value;

		return true;
	}
});

// TODO: ADD CONCEAL TYPES AND ESCAPE FIXER TYPES
export default [{
	proxifiedObj: locationProxy,
	globalProp: `["<proxyNamespace>"].sandbox.proxifiedLocation`
}, {
	proxifiedGetter: (ctx) => globalThis[ctx.globalNamespace].sandbox.proxifiedLocation.hostname,
	globalProp: `document.location`,
}, {
	proxifiedGetter: (ctx) => globalThis[ctx.globalNamespace].sandbox.proxifiedLocation.domain,
	globalProp: `document.location`
}] as APIInterceptor[];

const eventInterceptor = [{
	interceptor(event: Event, listener: eventListener) {
		if (event instanceof HashChangeEvent) {
			// @ts-ignore
			event.newURL = afterPrefix(event.newURL);
			// @ts-ignore
			event.oldURL = afterPrefix(event.oldURL);
		}
		listener(event);
	},
	type: "window",
	eventName: "hashchange",
	conceals: [{
		what: "HashChangeEvent.newURL",
		revealerType: {
			type: "url",
			reveals: "origin"
		}
	},
	{
		what: "HashChangeEvent.oldURL",
		revealerType: {
			type: "url",
			reveals: "origin"
		}
	}
	]
}, {
	interceptor(event: Event, listener: eventListener) {
		if (event instanceof MessageEvent)
			// @ts-ignore
			if (event.origin === $aero.sandbox.proxyLocation.origin)
				// @ts-ignore
				event.origin = $aero.sandbox.proxyLocation.origin;
		listener(event);
	},
	type: "window",
	eventName: ["message", "messageerror"],
	conceals: [{
		what: "MessageEvent.origin",
		revealerType: {
			type: "url",
			reveals: "origin"
		}
	}]
}]
export { eventInterceptor };
