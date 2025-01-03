/**
 * For request URL passthrough so the SW can handle the new navigation requests as an isolated Web Contents instance 
 * @see https://www.electronjs.org/docs/latest/api/webview-tag
 */
export type WebViewControls = Readonly<Partial<{
	/** This prop has nothing to do with the Electron APIs and is only here for IPC between the Electron WebView and the Electron Proxy Middleware. The client ID of the client that created the webview */
	webviewControlledBy: string;
	/** This param has nothing to do with the Electron APIs and is only here to so that the WebView element can get the webContentsId after it is created in the SW. */
	webContentsUUID: string;
	// Electron API properties
	/** This is an incremental number which is like the index of the web contents created */
	webContentsId: number;
	// `plugins` are not included because there will be no browser plugins implemented
	// `nodeIntegration` and `nodeintegrationinsubframes` are not included because there will be no Node.js subsystem implemented
	// `src` is not included here because it is obvious from the proxy URL
	/** @see https://www.electronjs.org/docs/latest/api/webview-tag#preload. Behavior for this must be implemented in AeroSandbox. */
	preload: boolean;
	/** @see https://www.electronjs.org/docs/latest/api/webview-tag#httpreferrer. Behavior for this must be implemented in the SW. */
	httpReferrer: string;
	/** @see https://www.electronjs.org/docs/latest/api/webview-tag#useragent */
	useragent: string;
	/** @see https://www.electronjs.org/docs/latest/api/webview-tag#disablewebsecurity */
	disablewebsecurity: boolean;
	/** @see https://www.electronjs.org/docs/latest/api/webview-tag#partition. Behavior for this must be implemented in AeroSandbox. The API Interceptors must consider `$aero.electronWebviewControls.partition` and include the part after `persist:` as something to prefix the storage keys by. In addition to this, all of the storage APIs must store their data in Session Storage if the `persist:`, including those that don't implement `Storage` so that the data is cleared after the browsing context is deleted. */
	partition: string;
	/** @see https://www.electronjs.org/docs/latest/api/webview-tag#allowpopups. Behavior for this must be implemented in AeroSandbox, specifically in the API Interceptor for window.open. It must check `$aero.electronWebviewControls.allowpopups` if `$aero.electronWebviewControls` is not an empty object. */
	allowpopups: string;
	/** @see https://www.electronjs.org/docs/latest/api/webview-tag#webpreferences. This would require a parser for [the preferences](https://www.electronjs.org/docs/latest/api/structures/web-preferences) */
	webpreferences: string;
	// `enableblinkfeatures` and `disableblinkfeatures` are not included because we are not trying to emulate Blink behavior
}>>;