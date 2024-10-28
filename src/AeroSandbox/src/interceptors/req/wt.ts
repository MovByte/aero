import type { APIInterceptor } from "$types/apiInterceptors.d.ts";

/** Only supported on Chromium **/
export default {
    /** I'm waiting for the bare/wisp spec to support WebTransport before implementing this **/
    skip: true,
    globalProp: "WebTransport"
} as APIInterceptor;
