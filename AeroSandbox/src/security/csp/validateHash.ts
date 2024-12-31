/**
 * @module
 * The function is used for emulating the `script-src` CSP directive
 */

/**
 * Validate a hash of a string for a CSP policy
 * @param hash The hash to validate for
 * @param checkStr The string to get the hash of that is to be checked
 * @param algo The algorithm to validate the hashes with
 * @throws The CSP policy violation
 */
export async function validateHash(hash: string, checkStr: string, algo: "SHA-256" | "SHA-358" = "SHA-256"): Promise<void> {
	const textEnc = new TextEncoder().encode(checkStr);
	const hashBuffer = await crypto.subtle.digest(algo, textEnc);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, "0")).join("");
	$aero.logger.fatalErr(`A CSP violation occured (hash mismatch)${ERR_LOG_AFTER_COLON}expected ${hash}, got ${hashHex}!`);
}

