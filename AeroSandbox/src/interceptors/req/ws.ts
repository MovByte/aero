import { proxyLocation } from "$shared/proxyLocation";

import {
	AltProtocolEnum,
	type APIInterceptor
} from "$types/apiInterceptors";

import { emuWSState } from "$types/interceptors/emuWS";

const socketMap: WeakMap<WebSocket, emuWSState> = new WeakMap();

export default [
	{
		proxyHandlers: {
			construct(target, args) {
				const emuWS = new EventTarget() as WebSocket;
				Object.setPrototypeOf(emuWS, target.prototype);
				emuWS.constructor = target;

				const bareWS = $aero.bc.createWebSocket(
					args[0],
					args[1],
					null,
					{
						"User-Agent": navigator.userAgent,
						Origin: proxyLocation().origin,
					}
				);
				const state: emuWSState = {
					extensions: "",
					protocol: "",
					url: args[0],
					binaryType: "blob",
					bareWS,
					onclose: null,
					onerror: null,
					onmessage: null,
					onopen: null,
				};

				function emuEventSend(emuEvent: Event) {
					const handlerFuncName = "on" + emuEvent.type;
					if (handlerFuncName in state)
						// @ts-ignore: this is a known global feature flag
						$aero.logger.fatalErr(`The BareMux transport for WebSockets must be broken because it is missing the event handler for the event type${ERR_LOG_AFTER_COLON}${emuEvent.type}`);
					else {
						state["on" + emuEvent.type]?.(emuEvent);
						emuWS.dispatchEvent(emuEvent);
					}
				}

				bareWS.addEventListener("open", () => {
					emuEventSend(new Event("open"));
				});
				bareWS.addEventListener("close", (event) => {
					emuEventSend(new CloseEvent("close", event));
				});
				bareWS.addEventListener("message", async (event) => {
					let payload = event.data;
					if (typeof payload !== "string") {
						if ("byteLength" in payload) {
							// arraybuffer, convert to blob if needed or set the proper prototype
							if (state.binaryType === "blob")
								payload = new Blob([payload]);
							else
								Object.setPrototypeOf(payload, ArrayBuffer.prototype);
						} else if ("arrayBuffer" in payload) {
							// blob, convert to arraybuffer if neccesary.
							if (state.binaryType === "arraybuffer") {
								payload = await payload.arrayBuffer();
								Object.setPrototypeOf(payload, ArrayBuffer.prototype);
							}
						}
					}

					const emuEvent = new MessageEvent("message", {
						data: payload,
						origin: event.origin,
						lastEventId: event.lastEventId,
						source: event.source,
						ports: event.ports,
					});

					emuEventSend(emuEvent);
				});
				bareWS.addEventListener("error", () => {
					emuEventSend(new Event("error"));
				});
				socketMap.set(emuWS, state);

				return emuWS;
			}
		},
		forAltProtocol: AltProtocolEnum.ws,
		globalProp: "Websocket"
	}, {
		proxifyGetter: (ctx) => {
			const ws = socketMap.get(ctx.this);
			return ws.binaryType;
		},
		proxifySetter: (ctx) => {
			const ws = socketMap.get(ctx.this);
			if (ctx.newVal === "blob" || ctx.newVal === "arraybuffer") ws.binaryType = ctx.newVal;
		},
		forAltProtocol: AltProtocolEnum.ws,
		globalProp: "WebSocket.prototype.binaryType"
	},
	{
		proxifyGetter: (_ctx) => {
			return 0;
		},
		forAltProtocol: AltProtocolEnum.ws,
		globalProp: "WebSocket.prototype.bufferedAmount"
	},
	{
		proxifyGetter: (ctx) => {
			const ws = socketMap.get(ctx.this);
			return ws.extensions;
		},
		forAltProtocol: AltProtocolEnum.ws,
		globalProp: "WebSocket.prototype.extensions"
	}, {
		proxifyGetter: (ctx) => {
			const ws = socketMap.get(ctx.this);
			return ws.onclose;
		},
		proxifySetter: (ctx) => {
			const ws = socketMap.get(ctx.this);
			ws.onclose = ctx.newVal;
		},
		forAltProtocol: AltProtocolEnum.ws,
		globalProp: "WebSocket.prototype.onclose"
	},
	{
		proxifyGetter: (ctx) => {
			const ws = socketMap.get(ctx.this);
			return ws.onerror;
		},
		proxifySetter: (ctx) => {
			const ws = socketMap.get(ctx.this);
			ws.onerror = ctx.newVal;
		},
		forAltProtocol: AltProtocolEnum.ws,
		globalProp: "WebSocket.prototype.onerror"
	},
	{
		proxifyGetter: (ctx) => {
			const ws = socketMap.get(ctx.this);
			return ws.onmessage;
		},
		proxifySetter: (ctx) => {
			const ws = socketMap.get(ctx.this);
			ws.onmessage = ctx.newVal;
		},
		forAltProtocol: AltProtocolEnum.ws,
		globalProp: "WebSocket.prototype.onmessage"
	},
	{
		proxifyGetter: (ctx) => {
			const ws = socketMap.get(ctx.this);
			return ws.onclose;
		},
		proxifySetter: (ctx) => {
			const ws = socketMap.get(ctx.this);
			ws.onclose = ctx.newVal;
		},
		forAltProtocol: AltProtocolEnum.ws,
		globalProp: "WebSocket.prototype.onopen"
	},
	{
		proxifyGetter: (ctx) => {
			const ws = socketMap.get(ctx.this);
			return ws.url;
		},
		forAltProtocol: AltProtocolEnum.ws,
		globalProp: "WebSocket.prototype.url"
	},
	{
		proxifyGetter: (ctx) => {
			const ws = socketMap.get(ctx.this);
			return ws.protocol;
		},
		forAltProtocol: AltProtocolEnum.ws,
		globalProp: "WebSocket.prototype.protocol"
	},
	{
		proxifyGetter: (ctx) => {
			const ws = socketMap.get(ctx.this);
			return ws.barews.readyState;
		},
		forAltProtocol: AltProtocolEnum.ws,
		globalProp: "WebSocket.prototype.readyState"
	},
	{
		proxyHandlers: {
			apply(_target, that, args) {
				const ws = socketMap.get(that);
				return ws.barews.send(args[0]);
			},
		},
		forAltProtocol: AltProtocolEnum.ws,
		globalProp: "WebSocket.prototype.send"
	},
	{
		proxyHandlers: {
			apply(_target, that, args) {
				const ws = socketMap.get(that);
				if (args[0] === undefined) args[0] = 1000;
				if (args[1] === undefined) args[1] = "";
				return ws.barews.close(args[0], args[1]);
			},
		},
		forAltProtocol: AltProtocolEnum.ws,
		globalProp: "WebSocket.prototype.close"
	}, {
		proxyHandlers: {
			apply(target, that, args) {
				if (args[1] instanceof Function) {
					const origFunc = args[1];
					args[1] = (event_, ...args_) => {
						event_.isTrusted = true;
						origFunc(event_, ...args_);
					};
				}
				return target.apply(that, args);
			},
		},
		forAltProtocol: AltProtocolEnum.ws,
		globalProp: "WebSocket.prototype.addEventListener"
	}] as APIInterceptor[];
