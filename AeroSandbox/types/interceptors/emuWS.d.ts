import type { BareWebSocket } from "@mercuryworkshop/bare-mux" with { "resolution-mode": "import" };


export type emuWSState = {
	extensions: string;
	protocol: string;
	url: string;
	binaryType: string;
	bareWS: BareWebSocket;

	onclose?: (ev: CloseEvent) => any;
	onerror?: (ev: Event) => any;
	onmessage?: (ev: MessageEvent) => any;
	onopen?: (ev: Event) => any;
};
