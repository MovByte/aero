import type { ResultAsync } from "neverthrow";
import { okAsync, errAsync as nErrAsync } from "neverthrow";
import { fmtNeverthrowErr } from "$shared/fmtErr";

// Utility
import { afterPrefix } from "$shared/getProxyUrl";
import getClientUrlThroughClient, { getClientUrlThroughForcedReferrer } from "$shared/getClientUrl";

/**
 * Wraps `getClientURL.ts` to be used in aero, with the context of the current aero SW handler being used accordingly with catch-all interception methods.
 * In order to use this function, you must have the feature flag `REQ_INTERCEPTION_CATCH_ALL` set to either `clients` or `referrer`. Prefer `clients` if you can (you must be using a SW).
 * You must also have a config in the global scope of the SW defined under `self.aeroConfig` with `aeroConfig.searchParamOptions.referrerPolicy` defined as any `string` if you are using the referrer method. Please read the aero docs page about forced-referrer if you want to learn more.
 * @param param0 The passthrough object needed to get the client URL
 * @returns The client URL wrapped in a `ResultAsync` object from *Neverthrow*
 * 
 * @example
 * import { fmtNeverthrowErr } from "$shared/fmtErr";
 * 
 * //*..(somewhere in the SW handler)
 * const clientUrlRes = await getClientURLAeroWrapper({
 *	reqUrl: req.url,
 *	reqHeaders: req.headers,
 *	reqParams: new URL(req.url).searchParams, 
 *	clientId: event.clientId,
 *	catchAllClientsValid: REQ_INTERCEPTION_CATCH_ALL === "clients" && event.clientId !== "",
 *	isNavigate: req.mode === "navigate" && ["document", "iframe"].includes(req.destination)
 * })
 * if (clientUrlRes.isErr()) {
 *	return fmtNeverthrowErr("Failed to get the client URL", clientUrlRes.error.message);
 * }
 */
export default async function getClientURLAeroWrapper({
	reqUrl,
	reqHeaders,
	reqParams,
	clientId,
	catchAllClientsValid,
	isNavigate
}: {
	/** The URL from the original request */
	reqUrl: URL;
	/** The headers from the original request */
	reqHeaders: Headers;
	/** The URL Parameters from the original request */
	reqParams: URLSearchParams;
	/** The Client ID associated with the client that initiated the fetch event */
	clientId: string;
	/** If the the `clients` method is being used and the Client ID is not missing */
	catchAllClientsValid: boolean;
	/** If the request is a navigation request to a document or an iframe (will resolve to a website) */
	isNavigate: boolean
}): Promise<ResultAsync<string, Error>> {
	/** The URL from the client's window */
	let clientUrl: URL;
	if (isNavigate) {
		clientUrl = new URL(afterPrefix(reqUrl));
	} else if (REQ_INTERCEPTION_CATCH_ALL === "clients") {
		logger.debug("Attempting catch-all interception through clients");
		if (!catchAllClientsValid)
			return nErrAsync(new Error("Missing the client ID required to get the client URL"));
		const clientUrlRes = await getClientUrlThroughClient(clientId);
		if (clientUrlRes.isErr()) {
			const err = clientUrlRes.error;
			return nErrAsync(logger.fatalErr(err));
		}
		clientUrl = clientUrlRes.value;
	} else if (REQ_INTERCEPTION_CATCH_ALL === "referrer") {
		logger.debug("Attempting catch-all interception through forced referrers");
		if (!reqHeaders.has("referer-policy"))
			return nErrAsync(
				new Error(
					"Somewhere along the line the force referrer policy enforcement neverhappened, since this is not a navigation request and there is no referrer policy on the Request object")
			);
		const clientUrlRes = await getClientUrlThroughForcedReferrer({
			reqParams,
			referrerPolicyParamName: aeroConfig.searchParamOptions.referrerPolicy,
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
		return nErrAsync(new Error(
			"No clientUrl found on a request to a resource! This means your windows are not accessible to us."
		));
	if (clientUrl) {
		// Ignore content scripts from extensions
		if (clientUrl.protocol === "chrome-extension:") {
			logger.debug("Ignoring content script");
			return okAsync("skip");
		}
		// Ignore view source
		if (clientUrl.protocol === "view-source:") {
			logger.debug("Ignoring view source");
			return okAsync("skip");
		}
		// Sanity check
		if (!clientUrl.protocol.startsWith("http")) {
			// TODO: Support custom protocols (web+...)
			return nErrAsync(new Error(
				`Unknown protocol used: ${clientUrl.protocol}. Full URL: ${clientUrl.href}.`
			));
		}
	}

	return okAsync(clientUrl);
}
