import type {
    APIInterceptor,
    anyWorkerExceptServiceWorkerEnumMember
} from "$types/apiInterceptors";

import { createEscapePropGetHandler } from "$shared/escape.ts";

//import { handleFetchEvent } from "$aero_browser/util/swlessUtils";

export default {
    proxifiedObj: Proxy.revocable(XMLHttpRequest, {
        construct(target, args) {
            if (args[2] === true) this.isSync = true;
            return Reflect.construct(target, args);
        },
        ...createEscapePropGetHandler(["isSync"])
        // TODO: Implement all of the things from the fetch interceptor into here
    }),
    globalProp: "XMLHttpRequest",
    exposedContexts: anyWorkerExceptServiceWorkerEnumMember
} as APIInterceptor;
