import {
	type APIInterceptor,
} from "$types/apiInterceptors";
import { ExposedContextsEnum } from "$types/apiInterceptors"

import { proxyLocation } from "$shared/proxyLocation";

export default [{
	proxifyGetter: (_ctx) => proxyLocation().protocol === "https:",
	globalProp: "isSecureContext",
	conceals: [{
		what: "itself",
		revealerType: {
			type: "url",
			// Because of fake protocol emulation!
			reveals: "realProtocol"
		}
	}],
	exposedContexts: ExposedContextsEnum.window
}] as APIInterceptor[];
