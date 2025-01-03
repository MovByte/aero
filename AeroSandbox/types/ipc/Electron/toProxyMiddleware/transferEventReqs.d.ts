/**
 * All the `for` types here should be `"get"` or `exec`
 */

export interface GetWebcontentsIdReq {
	for: "get";
	clientId: string;
	data: {
		webContentsUUID: string;
	}
}

/**
 * For the `<webview>` element, which is triggered as a fail response to the `<webview>.loadURL` method
 */
export interface GetDomEventDidFailLoad {
	for: "get",
	clientId: string;
	/**
	* For `<webview>.loadURL`'s fail response
	*/
	data: {
		proxyUrl: string;
	}
}
