/**
 * @module
 */

/**
 * @param htmlRules 
 */
export default function setRulesForMediaEmulation(htmlRules) {
	/*
	For **HLS emulation** you could rewrite the `.mpd` manifest file in the SW, but then you would have to rewrite the URL to a proxy that is not a SW-handled-path, because all the major browsers have their own media pipeline, which has native browser code that bypasses the SW
	*/
	htmlRules.set(HTMLMetaElement, {
		onAttrHandlers: {
			src(el: HTMLIFrameElement, newVal: string) {
				if (newVal.endsWith(".m3u8") && (
					// @ts-ignore: The check `el.canPlayType("application/vnd.apple.mpegurl")` is for Safari only
					el.canPlayType("application/vnd.apple.mpegurl") ||
					// This check is for any browser
					$aero.sandbox.ext.Hls.isSupported())) {
					const hls = new $aero.sandbox.ext.Hls();
					hls.loadSource(newVal);
					hls.attachMedia(el);
				}
			}
		}
	})
	/*
	For **MPEG-DASH emulation**, the situation is similar to **HLS emulation** when it comes to rewriting the `.m3u8` manifest file in the SW. 
	*/
	htmlRules.set(HTMLMetaElement, {
		onAttrHandlers: {
			src(el: HTMLIFrameElement, newVal: string) {
				if (newVal.endsWith(".mpd") ||
					// Check if the browser supports MPEG-DASH
					window.MediaSource && MediaSource.isTypeSupported("application/dash+xml")) {
					const dash = new $aero.sandbox.ext.dashjs.MediaPlayer();
					dash.initialize(el, newVal, true);
				}
			}
		}
	});
	// Note: This doesn't need to be done for `.webm` chunks, you are supposed to `fetch` them yourself from the data you recieve from the `sourceopen` event from the `MediaSource` object
}