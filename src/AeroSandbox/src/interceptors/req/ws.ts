import {
    AltProtocolEnum,
    type APIInterceptor
} from "$types/apiInterceptors";

export default {
    skip: true,
    forAltProtocol: AltProtocolEnum.webSockets,
    globalProp: "WebSocket"
} as APIInterceptor;


// TODO: (Percs) This file is incomplete
/*
import {
    AltProtocolEnum,
    type APIInterceptor
} from "$types/apiInterceptors.d.ts";

import { BareClient } from "@mercuryworkshop/bare-mux";

const client = new BareClient();

export default {
        proxifiedObj: Proxy.revocable(WebSocket, {
            construct(target, args) {
                return client.createWebSocket(
                    args[0],
                    args[1],
                    target,
                    {
                        "User-Agent": navigator.userAgent
                    },
                    ArrayBuffer.prototype
                );
            }
        }),
        forAltProtocol: AltProtocolEnum.webSockets,
        globalProp: "Websocket"
} as APIInterceptor;
*/
