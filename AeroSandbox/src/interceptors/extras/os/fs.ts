import { type APIInterceptor, ExposedContextsEnum } from "$types/apiInterceptors";

export default [
	// Intercept the downloading of a file
	{
		init(ctx) {
			if (ctx.featuresConfig.osExtras.fileDownload) {
				document.addEventListener("click", event => {
					const target = event.target as HTMLAnchorElement;
					if (target.tagName === "A" && target.href) {
						event.preventDefault();
						const bc = new BroadcastChannel("$aero-os-passthrough-new-file");
						bc.postMessage({
							clientId: $aero.clientId,
							for: "file-download",
							data: target.href
						});
					}
				})
			}
		},
		globalProp: "document.addEventListener"
	}, {
		createProxyHandler: ctx => ({
			apply(target, that, args) {
				if (ctx.featuresConfig.osExtras.fileUpload) {
					// @ts-ignore
					const passFileHandle = $aero.sandbox.extLib.syncify(new Promise((resolve, reject) => {
						const bc = new BroadcastChannel("$aero-os-passthrough-new-file");
						bc.postMessage({
							clientId: $aero.clientId,
							for: "file-picker-upload-prompt",
							data: passFileHandle
						});
						bc.onmessage = event => {
							if (event.data.clientId === $aero.clientId && event.data.for === "file-picker-upload-prompt-response") {
								if (!("user_dismissed" in event.data))
									throw new Error("The user dismissal status was not provided in the response!");
								if (event.data.user_dismissed) {
									reject(new AbortError("The user dismissed the file upload prompt!"));
								} else if (!("fileHandle" in event.data))
									throw new Error("The file handle was not provided in the response!");
								else if (event.data.fileHandle instanceof FileSystemHandle)
									resolve(event.data.fileHandle);
							}
						}
					}))();
					return passFileHandle;
				} else
					// Return to the default behavior
					return Reflect.apply(target, that, args);
			}
			// TODO: Import the @types for this
			// @ts-ignore
		} as ProxyHandler<Navigator["showOpenFilePicker"]>),
		globalProp: "navigator.prototype.showSaveFilePicker",
		exposedContexts: ExposedContextsEnum.window
	}] as APIInterceptor[];