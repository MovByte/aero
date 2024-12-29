import type {
	APIInterceptor,
	anyWorkerExceptServiceWorkerEnumMember
} from "$types/apiInterceptors";

import { createEscapePropGetHandler } from "$util/escape.ts";

export default {
	proxyHandlers: {
		construct(target, args) {
			if (args[2] === true) {
				this.isSync = true;
				this.syncBc = $aero.sandbox.ext.awaitSync($aero.bc);
			}

			return Reflect.construct(target, args);
		},
		...createEscapePropGetHandler(["isSync"])
	}),
	globalProp: "XMLHttpRequest",
	exposedContexts: anyWorkerExceptServiceWorkerEnumMember
} as APIInterceptor;
