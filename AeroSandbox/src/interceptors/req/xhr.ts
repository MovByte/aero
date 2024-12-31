import type {
	APIInterceptor,
	AnyWorkerExceptServiceWorkerEnumMember
} from "$types/apiInterceptors";

import { createEscapePropGetHandler } from "$util/escape.ts";

export default {
	proxyHandler: {
		construct(target, args) {
			if (args[2] === true) {
				this.isSync = true;
				this.syncBc = $aero.sandbox.extLib.syncify($aero.bc);
			}

			return Reflect.construct(target, args);
		},
		...createEscapePropGetHandler(["isSync"])
	}),
	globalProp: "XMLHttpRequest",
	exposedContexts: anyWorkerExceptServiceWorkerEnumMember
} as APIInterceptor;
