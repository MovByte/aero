import typia from "typia";

import { type APIInterceptor, ExposedContextsEnum } from "$types/apiInterceptors";
import { BrowserEmulationFeatures } from "$types/buildConfig";

import { proxyLocation } from "$shared/proxyLocation";

interface BeforeInstallPromptFakeEventResponse {
	clientId: string,
	for: "fake-event-response",
	fakeEventData: BeforeInstallPromptFakeEventData
}
interface BeforeInstallPromptFakeEventData {
	platforms: string[],
	userChoice: {
		outcome: "accepted" | "dismissed",
		platform: string
	}
};
const validateBeforeInstallPromptFakeEventResponse = typia.createValidate<BeforeInstallPromptFakeEventResponse>();

const beforeInstallPromptBc = new BroadcastChannel("$aero-browser-before-install-prompt");
const badgesTransferBc = new BroadcastChannel("$aero-browser-badges-transfer");
const badgesClearNoticeBc = new BroadcastChannel("$aero-browser-badges-clear-notice");

/** This will be populated later in `init` */
let appBadges = [];

export default [{
	init() {
		const fakeEventData = $aero.sandbox.extLib.syncify(new Promise((resolve, _reject) => {
			beforeInstallPromptBc.postMessage({
				clientId: $aero.clientId,
				for: "fake-event-request",
			});
			beforeInstallPromptBc.onmessage = event => {
				const resp = event.data as BeforeInstallPromptFakeEventResponse;
				validateBeforeInstallPromptFakeEventResponse(resp);
				if (event.data.clientId === $aero.clientId && event.data.for === "fake-event-response")
					resolve(event.data.fakeEventData);
			}
		}))() as BeforeInstallPromptFakeEventData;

		// TODO: Find the @types for this
		// @ts-ignore
		const fakeEvent = BeforeInstallPromptEvent("beforeinstallprompt", fakeEventData);
		window.dispatchEvent(fakeEvent);
	},
	for: "EVENT",
	interceptEvent: false,
	interceptEventOn: "WINDOW",
	eventName: "appinstalled",
}, {
	init(ctx) {
		appBadges = new Proxy([], {
			set(target, prop, value) {
				target[prop] = value;
				// Automatically save to disk
				localStorage.setItem("$aero-badges", JSON.stringify(appBadges));
				if (BrowserEmulationFeatures.webApps in ctx.featuresConfig.browserExtras)
					badgesTransferBc.postMessage({
						clientId: $aero.clientId,
						for: "badges-contents-changed",
						data: value
					});
				return true;
			}
		})
		if (BrowserEmulationFeatures.webApps in ctx.featuresConfig.browserExtras)
			badgesTransferBc.onmessage = event => {
				if (event.data.clientId === $aero.clientId && event.data.for === "get-badges")
					badgesTransferBc.postMessage({
						clientId: $aero.clientId,
						for: "send-badges",
						data: appBadges
					});
			}
	},
	proxyHandler: {
		apply(_target, _that, args) {
			const [contents] = args;
			if (appBadges.find(
				badge => badge.proxyOrigin === proxyLocation().origin,
				(_el, i) =>
					// Update if it already exists
					appBadges[i] = contents
			) === null) {
				// Add if it doesn't exist already
				appBadges.push({
					proxyOrigin: proxyLocation().origin,
					contents
				});
			}
		}
	} as ProxyHandler<Navigator["setAppBadge"]>,
	globalProp: "navigator.prototype.setAppBadge",
	exposedContexts: ExposedContextsEnum.window
}, {
	proxyHandler: {
		apply() {
			appBadges = appBadges.filter(appBadge => appBadge.proxyOrigin !== proxyLocation().origin);

			badgesClearNoticeBc.postMessage({
				clientId: $aero.clientId,
				for: "badges-contents-cleared"
			});
		},
	} as ProxyHandler<Navigator["clearAppBadge"]>,
	globalProp: "navigator.prototype.clearAppBadge",
	exposedContexts: ExposedContextsEnum.window
}] as APIInterceptor[];
