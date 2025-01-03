import typia from "typia";

// @ts-ignore: you must first run `npm i`
import type { ExecLoadURLRespData } from "$node_modules/proxy-middleware-bc/elecron-ipc/types/to-sandbox/transferDataResps.ts"

import { LitElement, property, customElement } from "lit-element";

/** Get the latest ID # for a webcontents instance. Intended for the SW */
const getWebcontentsId = new BroadcastChannel("$middleware-$electron-get-webcontents-id");
interface GetWebcontentsRespData {
	for: "send";
	data: {
		clientId: string;
		webkitId: string;
	}
}
const validateGetWebContentsRespData = typia.createValidate<GetWebcontentsRespData>();

// For the methods
const execLoadURL = new BroadcastChannel("$middleware-$electron-webview-exec-loadURL");
/**
 * For `<webview>.loadURL`
 */
interface ExecLoadURLReqData {
	for: "exec";
	method: "loadURL";
	data: {
		url: string;
		options: any;
	}
}

const validateExecLoadURLRespData = typia.createValidate<ExecLoadURLRespData>();
/**
 * `<webview>.downloadURL`
 */
interface ExecDownloadURLReqData {
	for: "exec";
	method: "downloadURL";
	data: {
		url: string;
		options: any;
	}
}
const validateExecDownloadURLReqData = typia.createValidator<ExecDownloadURLReqData>();

@customElement("webview")
export class WebView extends LitElement {
	@property({ type: String }) src: string = "";
	@property({ type: Boolean }) preload: boolean = false;
	@property({ type: String }) httpReferrer: string = "";
	@property({ type: String }) useragent: string = "";
	@property({ type: String }) disablewebsecurity: string = "";
	@property({ type: String }) partition: string = "";
	@property({ type: String }) allowpopups: string = "";

	webkitId: string;
	webContentsUUID = crypto.randomUUID();

	constructor() {
		super();
		this.webkitId = $aero.sandbox.extLib.syncify(
			new Promise((resolve) => {
				getWebcontentsId.postMessage({
					for: "get",
					clientId: $aero.clientId,
					webContentsUUID: this.webContentsUUID
				})
				getWebcontentsId.onmessage = event => {
					validateGetWebContentsRespData(event.data);
					resolve(event.data.webkitId);
				}
			}))();
	}

	/**
	 * 
	 * @param url 
	 * @param options
	 * @returns @see https://www.electronjs.org/docs/latest/api/webview-tag#webviewloadurlurl-options:~:text=load%20other%20files.-,returns,-Promise%3Cvoid%3E%20-%20The 
	 */
	private async loadURL(url, options): Promise<void> {
		return await new Promise((resolve, reject) => {
			execLoadURL.postMessage({
				for: "exec",
				clientId: $aero.clientId,
				method: "loadURL",
				data: {
					url,
					options
				}
			});
			execLoadURL.onmessage = event => {
				validateExecLoadURLRespData(event.data);
				if (event.data.data.successful) {
					resolve();
				} else {
					// FIXME: Idk what the actual error message is from Electron (the docs don't say)
					reject(new Error("The page failed to load!"));
				}
			}
		});
		return;
	}
	private downloadURL(url, options) {
		validateExecDownloadURLReqData()

	}
	private getURL() {

	}
}