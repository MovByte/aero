import type {
	APIInterceptor,
	anyWorkerExceptServiceWorkerEnumMember
} from "$types/apiInterceptors";

import type { BareMux } from "@mercuryworkshop/bare-mux";

import { createEscapePropGetHandler } from "$util/escape.ts";

//import { handleFetchEvent } from "$aero_browser/util/swlessUtils";

export default {
	proxifiedObj: Proxy.revocable(XMLHttpRequest, {
		isSync: boolean,
		syncBc: BareMux,
		construct(target, args) {
			if (args[2] === true) {
				this.isSync = true;
				this.syncBc = $aero.sandbox.ext.awaitSync($aero.bc);
			}

			return Reflect.construct(target, args);
		},
		...createEscapePropGetHandler(["isSync"])
		// TODO: Implement all of the things from the fetch interceptor into here
	}),
	globalProp: "XMLHttpRequest",
	exposedContexts: anyWorkerExceptServiceWorkerEnumMember
} as APIInterceptor;

/*
// TODO: This is an API that was last supported in IE11, so it would also not work in a SW.
export default {
	proxifiedObj: Proxy.revocable(XDomainRequest, {
		construct(target, args) {
			return Reflect.construct(target, args);
		}
	})
	...
}
*/