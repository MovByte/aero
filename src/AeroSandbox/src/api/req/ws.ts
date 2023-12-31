import { backends, flags } from "$aero_config";

import { BareClient } from "@tomphttp/bare-client";

import rewriteSrc from "$aero/shared/src";
import { proxyLocation } from "$aero_browser/misc/proxyLocation";

declare var WebTransport;

if (flags.ws) {
	const bare = new BareClient(backends[0]);

	// TODO: Implement middleware for WS with wsReq handle
	WebSocket = bare.createWebsocket;

	// Only supported on Chromium
	if ("WebTransport" in window)
		WebTransport = new Proxy(WebTransport, {
			construct(target, args) {
				const [url] = args;

				args[0] = rewriteSrc(url, proxyLocation().href);

				return Reflect.construct(target, args);
			},
		});
}
