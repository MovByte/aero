import { type APIInterceptor, URL_IS_ESCAPE } from "$types/apiInterceptors";

import { afterPrefix } from "../util/getProxyURL";

export default {
	proxifiedGetter(ctx) {
		return afterPrefix(ctx.this);
	},
	escapeFixes: {
		what: "URL_STRING",
		type: URL_IS_ESCAPE.FULL_URL
	},
	globalProp: "File.prototype.webkitRelativePath",
	exposedContexts: "ALL"
} as APIInterceptor;