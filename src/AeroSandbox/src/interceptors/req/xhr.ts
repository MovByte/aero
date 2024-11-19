import type {
	APIInterceptor,
	anyWorkerExceptServiceWorkerEnumMember
} from "$types/apiInterceptors";

import type { BareMux } from "@mercuryworkshop/bare-mux";

import { createEscapePropGetHandler } from "$shared/escape.ts";

//import { handleFetchEvent } from "$aero_browser/util/swlessUtils";

export default {
	proxifiedObj: Proxy.revocable(XMLHttpRequest, {
		construct(target, args) {
			if (args[2] === true) this.isSync = true;
			const syncBc: BareMux = $aero.sandbox.ext.awaitSync($aero.bc);

			// TODO: Fetch the request just like I do in the SW (TODO: abstract fetching/request rewriting logic (this will be done in `$aero/util/handlers/request.ts`) (it would also help with porting aero to other runtimes for server-only) from the SW because of this new use case)

			return Reflect.construct(target, args);
		},
		...createEscapePropGetHandler(["isSync"])
		// TODO: Implement all of the things from the fetch interceptor into here
	}),
	globalProp: "XMLHttpRequest",
	exposedContexts: anyWorkerExceptServiceWorkerEnumMember
} as APIInterceptor;
