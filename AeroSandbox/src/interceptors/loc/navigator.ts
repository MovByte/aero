declare var $aero: AeroTypes.GlobalAeroCTX;

/*
import rewriteSrc from "$util/src";

import { proxyLocation } from "$util/proxyLocation";


Navigator.prototype.sendBeacon = new Proxy(Navigator.prototype.sendBeacon, {
	apply(target, that, args) {
		const [url] = args;

		args[0] = rewriteSrc(url, proxyLocation().href);

		return Reflect.apply(target, that, args);
	},
});

// Sandbox data to their respective origin
{
	const protoHandler = {
		apply(target, that, args) {
			const [scheme, url] = args;

			args[0] = $aero.proto.set(scheme);
			args[1] = rewriteSrc(url, proxyLocation().href);

			return Reflect.apply(target, that, args);
		},
	};

	navigator.registerProtocolHandler = new Proxy(
		navigator.registerProtocolHandler,
		protoHandler
	);
	navigator["unregisterProtocolHandler"] = new Proxy(
		navigator["unregisterProtocolHandler"],
		protoHandler
	);
}
{
	const key = "aero.badges";
	const item = localStorage.getItem(key);

	let badges = item === null ? [] : JSON.parse(item) ?? [];

	let badge;

	const found = badges.find(
		badge => badge.origin === proxyLocation().origin,
		(_el, i) => {
			badge = badges[i];
		}
	);

	if (!found) {
		badge = {
			origin: proxyLocation().origin,
			i: 0,
		};

		badges.push(badge);
	}

	const setBak = navigator.setAppBadge;

	function getTotal() {
		let i = 0;

		for (const badge of badges) i += badge.i;

		return i;
	}
	function updateCount() {
		badges.find(
			badge => badge.origin === proxyLocation().origin,
			(_el, i) => {
				// Local
				badges[i] = badge;
				// Update
				setBak(getTotal());
				// Save
				localStorage.setItem(key, badge);
			}
		);
	}

	navigator.setAppBadge = new Proxy(navigator.clearAppBadge, {
		apply(target, that, args) {
			const [contents] = args;

			badge.i = contents;

			updateCount();
		},
	});
	navigator.clearAppBadge = new Proxy(navigator.clearAppBadge, {
		apply() {
			badge.i = 0;

			updateCount();
		},
	});
}
*/
