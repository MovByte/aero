import { type APIInterceptor, ExposedContextsEnum } from "$types/apiInterceptors";

const osPassthroughNewDirBc = new BroadcastChannel("$aero-os-passthrough-new-dir");
const osPassthroughNewFileBc = new BroadcastChannel("$aero-os-passthrough-new-file");

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
				if (ctx.featuresConfig.osExtras.uploads) {
					// @ts-ignore
					const passFileHandle = $aero.sandbox.extLib.syncify(new Promise((resolve, reject) => {
						osPassthroughNewDirBc.postMessage({
							clientId: $aero.clientId,
							for: "file-picker-prompt",
							data: passFileHandle
						});
						osPassthroughNewDirBc.onmessage = event => {
							if (event.data.clientId === $aero.clientId && event.data.for === "prompt-response") {
								if (!("user_dismissed" in event.data))
									throw new Error("The user dismissal status was not provided in the response!");
								if (event.data.user_dismissed) {
									reject(new AbortError("The user dismissed the file upload prompt!"));
								} else if (!("fileHandle" in event.data))
									throw new Error("The file handle was not provided in the response!");
								else if (event.data.dirHandle instanceof FileSystemDirectoryHandle)
									resolve(event.data.dirHandle);
								else
									throw new Error(`The directory handle object provided was not an instance of \`FileSystemDirectoryHandle\`! Instead it was: ${event.data.dirHandle}`);
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
		globalProp: "Navigator.prototype.showSaveFilePicker",
		exposedContexts: ExposedContextsEnum.window
	}, {
		createProxyHandler: ctx => ({
			apply(target, that, args) {
				if (ctx.featuresConfig.osExtras.uploads) {
					// @ts-ignore
					const passFileHandle = $aero.sandbox.extLib.syncify(new Promise((resolve, reject) => {
						osPassthroughNewDirBc.postMessage({
							clientId: $aero.clientId,
							for: "file-picker-upload-prompt",
							data: passFileHandle
						});
						osPassthroughNewDirBc.onmessage = event => {
							if (event.data.clientId === $aero.clientId && event.data.for === "prompt-response") {
								if (!("user_dismissed" in event.data))
									throw new Error("The user dismissal status was not provided in the response!");
								if (event.data.user_dismissed) {
									reject(new AbortError("The user dismissed the file upload prompt!"));
								} else if (!("fileHandle" in event.data))
									throw new Error("The file handle was not provided in the response!");
								else if (event.data.fileHandle instanceof FileSystemHandle)
									resolve(event.data.fileHandle);
								else
									throw new Error(`The file handle object provided was not an instance of \`FileSystemHandle\`! Instead it was: ${event.data.dirHandle}`);
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
		globalProp: "Navigator.prototype.showSaveFilePicker",
		exposedContexts: ExposedContextsEnum.window
	}] as APIInterceptor[];