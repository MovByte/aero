import { type APIInterceptor, ExposedContextsEnum } from "$types/apiInterceptors";
import { BrowserEmulationFeatures, OsPassthroughFeatures } from "$types/buildConfig";

import { throwMissingPropExpectedOfBC } from "$src/interceptors/util/bcCommunication/expectParamsInMsgResp";
import { proxyLocation } from "$shared/proxyLocation";

interface BeforeInstallPromptFakeEventData {
	platforms: string[],
	userChoice: {
		outcome: "accepted" | "dismissed",
		platform: string
	}
};

const bc = new BroadcastChannel("$aero-browser-badges");

export default [{
	init() {
		// TODO: Runtime validate FakeEvent data
		const fakeEventData = $aero.sandbox.extLib.syncify(new Promise((resolve, reject) => {
			const bc = new BroadcastChannel("$aero-browser-before-install-prompt");
			bc.postMessage({
				clientId: $aero.clientId,
				for: "fake-event-request",
			});
			bc.onmessage = event => {
				throwMissingPropExpectedOfBC("the fake event response", ["clientId", "for", "fakeEvent"], event);
				const resp = event.data as BeforeInstallPromptFakeEventData;
				if (event.data.clientId === $aero.clientId && event.data.for === "fake-event-response")
					resolve(event.data.fakeEventData);
			}
		}))() as {
			platforms: string[],
			userChoice: {
				outcome: "accepted" | "dismissed",
				platform: string
			}
		};
		if ()
			passEventData = event.data;
		const fakeEvent = BeforeInstallPromptEvent("beforeinstallprompt");
		window.dispatchEvent(
	}
	interceptFull(event, listener) {
		const listenerResult = listener(event);
	},
	// TODO: Make Intercept before
	interceptAfter(listenerResult) {

	},
	interceptEvent: true,
	interceptEventOn: "WINDOW",
	eventName: "appinstalled",
}, {
	init(ctx) {
		$aero.sandbox.appBadges = new Proxy([], {
			set(target, prop, value) {
				target[prop] = value;
				// Automatically save to disk
				localStorage.setItem("$aero-badges", JSON.stringify($aero.sandbox.appBadges));
				if (BrowserEmulationFeatures.webApps in ctx.featuresConfig.browserExtras)
					bc.postMessage({
						clientId: $aero.clientId,
						for: "badges-contents-changed",
						data: value
					});
				return true;
			}
		})
		if (BrowserEmulationFeatures.webApps in ctx.featuresConfig.browserExtras)
			bc.onmessage = event => {
				if (event.data.clientId === $aero.clientId && event.data.for === "get-badges")
					bc.postMessage({
						clientId: $aero.clientId,
						for: "send-badges",
						data: $aero.sandbox.appBadges
					});
			}
	},
	proxyHandler: {
		apply(_target, _that, args) {
			const [contents] = args;
			if ($aero.sandbox.appBadges.find(
				badge => badge.proxyOrigin === proxyLocation().origin,
				(_el, i) =>
					// Update if it already exists
					$aero.sandbox.appBadges[i] = contents
			) === null) {
				// Add if it doesn't exist already
				$aero.sandbox.appBadges.push({
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
			$aero.sandbox.appBadges = $aero.sandbox.appBadges.filter(appBadge => appBadge.proxyOrigin !== proxyLocation().origin);
			bc.postMessage({
				clientId: $aero.clientId,
				for: "badges-contents-cleared"
			});
		},
	} as ProxyHandler<Navigator["clearAppBadge"]>,
	globalProp: "navigator.prototype.clearAppBadge",
	exposedContexts: ExposedContextsEnum.window
}] as APIInterceptor[];
