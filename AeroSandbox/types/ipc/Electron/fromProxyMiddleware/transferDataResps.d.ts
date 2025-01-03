/**
 * All the `for` types here should be `"send"`
 */

/**
 * For `<webview>.loadURL`
 */
export interface ExecLoadURLResp {
	for: "exec-status-resp";
	method: "loadURL";
	data: {
		successful: true
	} | {
		successful: false;
		eventDidFailLoad: EventDidFailLoad;
	}
}

/**
 * For the `<webview>` element
 */
export interface SendDomEventDidFailLoadTrace {
	for: "send";
	clientId: string;
	data: SendDomEventDidFailLoadTrace
}
export interface SendDomEventDidFailLoadTrace {
	errorCode: number;
	errorDescription: string;
	validatedURL: string;
	isMainFrame: boolean;
}