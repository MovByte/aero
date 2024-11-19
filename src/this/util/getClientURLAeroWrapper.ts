import type { ResultAsync } from "neverthrow";
import { okAsync, errAsync as errrAsync } from "neverthrow";
import { fmtNeverthrowErr } from "$util/fmtErr";

import type { Config } from "$aero/types/config";
import type { AeroLogger } from "$aero/src/AeroSandbox/build/Logger";
import { Sec } from "$aero/types";

// Utility
import { afterPrefix } from "$sharedUtil/getProxyUrl";
import getClientUrlThroughClient, { getClientUrlThroughForcedReferrer } from "$util/getClientURL";

/**
 * Wraps `getClientURL.ts` to be used in aero, with the context of the current aero SW handler
 * @param pass 
 * @returns The client URL
 */
export default async function getClientURLAeroWrapper({
	reqUrl,
	reqHeaders,
	clientId,
	params,
	catchAllClientsValid,
	isNavigate
}: {
	/** The URL from the original request */
	reqUrl: URL;
	/** The headers from the original request */
	reqHeaders: Headers;
	clientId: string;
	params: URLSearchParams;
	catchAllClientsValid: boolean;
	isNavigate: boolean
}): Promise<ResultAsync<string, Error>> {
	/** The URL from the client's window */
	let clientUrl: URL;
	if (isNavigate) {
		clientUrl = new URL(afterPrefix(reqUrl));
	} else if (REQ_INTERCEPTION_CATCH_ALL === "clients") {
		if (!catchAllClientsValid)
			return errrAsync(new Error("Missing the client ID required to get the client URL"));
		const clientUrlRes = await getClientUrlThroughClient(clientId);
		if (clientUrlRes.isErr()) {
			const err = clientUrlRes.error;
			return errrAsync(logger.fatalErr(err));
		}
		clientUrl = clientUrlRes.value;
	} else if (REQ_INTERCEPTION_CATCH_ALL === "referrer") {
		if (!reqHeaders.has("referer-policy"))
			return errrAsync(
				new Error(
					"Somewhere along the line the force referrer policy enforcement neverhappened, since this is not a navigation request and there is no referrer policy on the Request object")
			);
		const clientUrlRes = await getClientUrlThroughForcedReferrer({
			params,
			referrerPolicyKey: aeroConfig.searchParamOptions.referrerPolicy,
			referrerPolicy: reqHeaders.get("referrer-policy")
		})
		if (clientUrlRes.isErr())
			return fmtNeverthrowErr(
				"Failed to get the client URL through the forced referrer policy", clientUrlRes.error.message
			)
		clientUrl = clientUrlRes.value;
	} else
		return fmtNeverthrowErr(
			"No catch-all interception types found and rewrite-url is currently unsupported"
		);

	// Sanity check
	if (!isNavigate && !clientUrl)
		// TODO: Make a custom fatalErr for SWs that doesn't modify the DOM but returns the error simply instead of overwriting the site with an error site
		return errrAsync(new Error(
			"No clientUrl found on a request to a resource! This means your windows are not accessible to us."
		));
	if (clientUrl) {
		// Ignore content scripts from extensions
		if (clientUrl.protocol === "chrome-extension:") {
			logger.log("Ignoring content script");
			return okAsync("skip");
		}
		// Ignore view source
		if (clientUrl.protocol === "view-source:") {
			logger.log("Ignoring view source");
			return okAsync("skip");
		}
		// Sanity check
		if (!clientUrl.protocol.startsWith("http")) {
			// TODO: Support custom protocols (web+...)
			return errrAsync(new Error(
				`Unknown protocol used: ${clientUrl.protocol}. Full URL: ${clientUrl.href}.`
			));
		}
	}

	return okAsync(clientUrl);
}
