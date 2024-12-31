// @ts-nocheck
/**
 * There are **3** ways to detect proxies using the Performance APIs
Using `entry.name` to expose the url:
 *   - Using `entry.name` to expose the url
 *   - If the site was rewritten or the headers were modified, the size would be different than what is intended. You can think of this as a form of hash checking
 *   - If you make a request to two different proxy origins on the site that are both cached and one has the `Clear-Site-Data`, clearing both proxy origins, so *the proxy can be detected*
 */

import { type APIInterceptor, SupportEnum, URL_IS_ESCAPE } from "$types/apiInterceptors";

import getMsgFromSW from "$util/getMsgFromSW";
import { fmtMissingPropExpectedOfSW } from "../util/bcCommunication/expectParamsInMsgResp";
import getValFromSW from "$util/getValFromSW";
import { afterPrefix } from "$shared/afterPrefix";
import upToProxyLocation from "$shared/upToProxyLocation";

export default [{
	init() {
		// Get the timing data whenever a new request comes in
		getMsgFromSW("perf-timing-resp-cached", event => {
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
	conceals: [
		{
			targeting: "API_RETURN",
			type: {
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
			const respCachedArchive = getRespCachedArchive();
			const respCachedData = respCachedArchive.get(proxyUrl);
			switch (prop) {
				case "transferSize":
					return isZero ? 0 : respCachedData.transferSize;
				case "encodedBodySize":
					return !respCachedData.encBody ? isZero ? 0 : respCachedData.bodySize :
						// Let it error-out
						Reflect.get(target, prop, receiver);
				case "decodedBodySize":
					return respCachedData.encBody ?
						// Let it error-out
						Reflect.get(target, prop, receiver) : isZero ? 0 : respCachedData.bodySize;
				default:
					return Reflect.get(target, prop, receiver);
			}
		},
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

/**
 * Check if a recent request (from the proxy URL) on this page was cached
 * @param proxyUrl 
 * @returns Whether the request was cached
 */
function isCached(proxyUrl: string): boolean {
	let res = $aero.resInfo.get(proxyUrl);
	return res ? proxyUrl in res : false;
}

/**
 * Gets the context of the timing of a cached response
 * @returns The context of the timing of a cached response
 * @throws {Error} An error and the aero crash page if some part of the the expected context is missing
 */
function getRespCachedArchive(): {
	timing: number;
	encBody: boolean;
	bodySize: number;
} {
	const respCachedArchive = getValFromSW({
		name: "resp-cached-archive",
	});
	if (!("timing" in respCachedArchive))
		$aero.logger.fatalErr(fmtIsMissingProp("timing"));
	if (!("encBody" in respCachedArchive))
		$aero.logger.fatalErr(fmtIsMissingProp("encBody"));
	if (!("bodySize" in respCachedArchive))
		$aero.logger.fatalErr(fmtIsMissingProp("bodySize"));
	return respCachedArchive;
}
/**
 * This is a helper method used by `getRespCachedArchive` to format the error message for when a property is missing
 * @param prop The property that is missing
 */
function fmtIsMissingProp(prop: string): string {
	return fmtMissingPropExpectedOfSW("response cache archive", prop);
}