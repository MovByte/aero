// Not finished

import { afterPrefix } from "$util/getProxyURL";

import { proxyLocation } from "$util/proxyLocation";

import { type APIInterceptor, SupportEnum } from "$types/apiInterceptors.d.ts";

export default [
	// Entries
	// FIXME:
	{
		proxyHandlers: {
			apply(target, that, args) {
				const entries: any[] = Reflect.apply(target, that, args);

				// We may delete some entries, so we will update the index with the new index
				let i = 0;

				const newEntries: any[] = [];

				for (const entry of entries) {
					const newEntry = entry;

					// The original property is a getter property, as the value will be changed dynamically
					Object.defineProperty(newEntry, "url", {
						get: () => entry.url.replace(afterPrefix, "")
					});

					try {
						if (
							new URL(newEntry.url).origin !==
							proxyLocation().origin
						)
							// The site is not supposed to see this entry
							continue;
					} catch {
						continue;
					}

					// Offset the index to delete the entry change without the site noticing
					Object.defineProperty(newEntry, "index", {
						value: i++
					});

					newEntries.push(newEntry);
				}

				return newEntries;
			}
		},
		globalProp: "navigation.entries",
		conceals: [{
			what: "NavigationEntry.url",
			revealerType: {
				type: "url",
				reveals: "escapedUrl"
			}
		}],
		supports: SupportEnum.draft | SupportEnum.shippingChromium
	},
	{
		emuFunc: () => proxyLocation().href,
		globalProp: "navigation.transition.from",
		conceals: [{
			what: "itself",
			revealerType: {
				type: "url",
				reveals: "realUrl"
			}
		}],
		supports: SupportEnum.draft | SupportEnum.shippingChromium
	},
	{
		proxifiedObj: Proxy.revocable(navigation.addEventListener, {
			apply(target, that, args) {
				const [messageType, listener] = args;

				if (messageType === "currententrychange")
					args[1] = (event: NavigationCurrentEntryChangeEvent) => {
						if ("url" in event.from)
							Object.defineProperty(event.from, "url", {
								get: () => afterPrefix(event.from.url),
								configurable: false
							});

						event.from.addEventListener = new Proxy(
							event.from.addEventListener,
							// @ts-ignore
							i2.proxifiedObj
						);

						listener(event);
					};

				return Reflect.apply(target, that, args);
			}
		}),
		globalProp: "navigation.addEventListener",
		conceals: [{
			what: "NavigationCurrentEntryChangeEvent.from.url",
			revealerType: {
				type: "url",
				reveals: "escapedUrl"
			}
		}],
		supports: SupportEnum.draft | SupportEnum.shippingChromium
	}
] as APIInterceptor[];
