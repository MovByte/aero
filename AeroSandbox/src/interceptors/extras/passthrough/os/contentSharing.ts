/**
 * Content Sharing
 */

import { type APIInterceptor, ExposedContextsEnum, SupportEnum } from "$types/apiInterceptors";
import { OsPassthroughFeatures } from "$types/buildConfig";

import rewriteSrc from "$util/src";
import { proxyLocation } from "$shared/proxyLocation";

const osPassthroughNewFileBC = new BroadcastChannel("$aero-os-passthrough-share-content");

export default [{
	createProxyHandler: ctx => ({
		proxyHandler: {
			apply(target, that, args) {
				if (OsPassthroughFeatures.contentSharing in ctx.featuresConfig.osExtras) {
					const [data] = args;
					osPassthroughNewFileBC.postMessage({
						clientId: $aero.clientId,
						for: "send-content",
						data
					})
				} else
					return Reflect.apply(target, that, args);
			}
		}
	}),
	for: "OS_EXTRA",
	globalProp: "Navigator.prototype.share",
	exposedContexts: ExposedContextsEnum.window,
	supports: SupportEnum.nonstandard
}, {
	proxifyGetter: ctx => OsPassthroughFeatures.contentSharing in ctx.featuresConfig.osExtras ? true : ctx.this,
	for: "OS_EXTRA",
	globalProp: "Navigator.prototype.canShare",
	exposedContexts: ExposedContextsEnum.window,
	supports: SupportEnum.nonstandard
}] as APIInterceptor[];