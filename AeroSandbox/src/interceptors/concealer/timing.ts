/**
 * There are 3 ways to detect proxies using the Performance API
Using entry.name to expose the url:
 *   - Using entry.name to expose the url
 *   - If the site was rewritten or the headers were modified, the size would be different than what is intended. You can think of this as a form of hash checking.
 *   - If you make a request to two different proxy origins on the site that are both cached and one has the `Clear-Site-Data`, clearing both proxy origins, so the proxy can be detected
 */

import { type APIInterceptor, SupportEnum, URL_IS_ESCAPE } from "$types/apiInterceptors";

import getMsgFromSW from "$util/getMsgFromSW";
import { afterPrefix } from "$shared/afterPrefix";
import upToProxyLocation from "$shared/upToProxyLocation";

export default [{
	init: () => {
		// Get the data from the SW
		getMsgFromSW("perf-timing-res-cached", event => {
			const { url, cached } = event.data.payload;
			$aero.resInfo.set(url, cached);
		});
	},
	globalProp: "performance"
}, {
	proxyHandler: {
		apply(target, that, args) {
			let realEntries: PerformanceEntryList = Reflect.apply(
				target,
				that,
				args
			);
			const proxifiedEntries = realEntries
				// Hide aero's injection (bundle)
				.filter(
					entry =>
						!entry.name.startsWith(location.origin + $aero.config.bundle)
				);
			return proxifiedEntries;
		},
	},
	escapeFixes: [
		{
			targeting: "API_RETURN",
			escapeType: {
				what: "URL_STRING",
				is: URL_IS_ESCAPE.FULL_URL
			}
		}
	],
	globalProp: "performance.getEntries",
	supports: SupportEnum.widelyAvailable
}, {
	proxifyGetter: ctx => {
		const realUrl = ctx.this;
		const proxyUrl = afterPrefix(realUrl);
		return proxyUrl;
	},
	conceals: [
		{
			targeting: "URL_STRING",
			is: URL_IS_ESCAPE.FULL_URL
		}
	],
	globalProp: "PerformanceResourceTiming.prototype.name",
	supports: SupportEnum.widelyAvailable
}, {
	proxifyGetter: ctx => {
		ctx.that.name
		return afterPrefix(ctx.this)
	},
	proxyHandler: {
		get(target, prop, receiver) {
			const realUrl = target.name;
			const proxyUrl = afterPrefix(realUrl);
			const resCached = isCached(proxyUrl);
			const resCrossOrigin = !proxyUrl.startsWith(
				upToProxyLocation()
			);
			const isZero =
				resCached ||
				resCrossOrigin ||
				"timing" in $aero.sec;
			if (target[prop] === "transferSize") {
				return isZero ? 0 : getAeroHeader(proxyUrl, "size-transfer");
			}
			if (target[prop] === "encodedBodySize") {
				if (isZero) return 0;
				return await getAeroHeader(
					proxyUrl,
					"x-aero-size-encbody"
				);
			}
			if (target[prop] === "decodedBodySize") {
				if (isZero) return 0;
				return await getBodySize(proxyUrl);
			}
			return Reflect.get(target, prop, receiver);
		},
		conceals: {
			targeting: "VALUE_PROXIFIED_OBJ",
			props_that_reveal: {
				"transferSize": [
					{
						what: "REAL_DATA_SIZE",
						type: "TRANSFER"
					}
				],
				"encodedBodySize": [
					{
						what: "REAL_DATA_SIZE",
						type: "BODY",
						encoded: true
					}
				],
				"decodedBodySize": [
					{
						what: "REAL_DATA_SIZE",
						type: "BODY",
						encoded: false
					}
				]
			}
		},
		globalProp: "PerformanceResourceTiming.prototype",
		supports: SupportEnum.widelyAvailable
	}] as APIInterceptor;


function isCached(url: string) {
	let res = $aero.resInfo.get(url);

	return res ? url in res : false;
}

// FIXME: Instead of doing this in the interceptor, record the data in the SW later to reduce request volume and just use getMsgFromSW with sync-async and a custom promise
// FIXME: Prefix the size headers with "x-aero-perf-..."
async function getAeroHeader(url: string, headerName: string) {
	const resp = await fetch(url);

	return resp.headers[`x-aero-${headerName}`];
}
async function getBodySize(url: string) {
	return await getAeroHeader(url, "size-body");
}
