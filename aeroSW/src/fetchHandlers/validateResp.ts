/**
 * @module
 */

import type { Result } from "neverthrow";
import { err as nErr } from "neverthrow";

/** 
 * This function contains sanity checks for if the response is invalid.
 * When using it, you should propogate the Neverthrow error up the chain if you are also using Neverthrow
 * @param resp The response to validate
 */
export default async function validateResp(resp: undefined | Error | Response): Result<void, Error> {
	if (!resp) return nErr(new Error("No response found! The response is invalid"));
	if (resp instanceof Error) {
		if (resp instanceof NetworkError)
			return fmtNeverthrowErr("Failed to fetch the response from the proxy server backend", Error);
		return fmtNeverthrowErr("Failed to fetch the response from the BareMux transport", resp.message);
	}
}