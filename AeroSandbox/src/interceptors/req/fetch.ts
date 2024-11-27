import {
	type APIInterceptor,
	anyWorkerEnumMember
} from "$types/apiInterceptors.d.ts";
//import { handleFetchEvent } from "$aero_browser/util/swlessUtils";

export default {
	proxifiedObj: Proxy.revocable(fetch, {
		apply(target, that, args) {
			let [, opts]: [any?, RequestInit?] = args;
			opts ??= {};

			opts =
				args[0] instanceof Request
					? {
						...args[0],
						...opts
					}
					: opts;

			const headers: Record<string, string> = {};

			if (
				opts.cache &&
				// only-if-cached requires the mode to be same origin
				!(
					opts.mode !== "same-origin" &&
					opts.cache === "only-if-cached"
				)
			) {
				// Emulate cache mode
				if (headers instanceof Headers)
					headers.append("x-aero-cache", opts.cache);
				else headers["x-aero-cache"] = opts.cache;
			}

			// TODO: Apply CORS emulation with the passthrough data from `$aero.sec` with for the directives: `connect-src`, TODO:...

			/*
			if ($aero.sandbox.swlessEnabled) {
				const request = createRequest(opts, headers);
				const nonDefaultResp = handleFetchEvent({ request });
				if (nonDefaultResp) return nonDefaultResp;
			}
			*/

			return Reflect.apply(target, that, args).then((resp: Response) => {
				const pass = resp.headers.get("x-headers");

				if (pass !== null) resp.headers = new Headers(JSON.parse(pass));

				// Conceal the site's origin if it is revealed
				const respUrl = new URL(resp.url);
				if (respUrl.origin === location.origin) return new Response();

				return resp;
			});
		}
	}),
	globalProp: "fetch"
} as APIInterceptor;

/*
function createRequest(opts: RequestInfo | URL, headers: Record<string, string>) {
	return new Request(opts, { headers });
}
*/
