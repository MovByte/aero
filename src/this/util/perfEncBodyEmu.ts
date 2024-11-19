/**
 * Rewrites your already rewritten response headers with the body length and the encoded body length headers rewritten as well
 * @param rewrittenBody The rewritten response body (for reference)
 * @param rewrittenRespHeaders The existing rewritten response headers 
 */
export default async function performEncBodyEmu(rewrittenBody: string | ArrayBuffer, rewrittenRespHeaders: Headers): Promise<void> {
	// FIXME: Fix whatever this is. I forgot where I was going with this.
	// TODO: Emulate x-aero-size-transfer
	if (typeof rewrittenBody === "string") {
		rewrittenRespHeaders.set("x-aero-size-body", String(new TextEncoder().encode(
			rewrittenBody
		).length));
		// TODO: Emulate x-aero-size-encbody
	} else if (rewrittenBody instanceof ArrayBuffer) {
		rewrittenRespHeaders.set("x-aero-size-body", String(rewrittenBody.byteLength));
		// TODO: Emulate x-aero-size-encbody
	}
}