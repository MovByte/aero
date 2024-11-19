// Neverthrow
import type { Result } from "neverthrow";
import { ok, err } from "neverthrow";
import { fmtNeverthrowErr } from "$util/fmtErr";

// Utility
import getRequestUrl from "$sharedUtil/getRequestUrl";

/**
 * Get the proxy URL to be used for fetching the site under the proxy
 * @param pass 
 * @returns The proxy URL ready to be fetched through a proxy fetcher wrapped in a `Result` object from *Neverthrow*
 */
export default function getProxyUrl({
	reqUrl,
	clientUrl,
	isNavigate,
	isiFrame
}: {
	/** The URL from the original request */
	reqUrl: URL;
	clientUrl: string;
	isNavigate: boolean,
	isiFrame: boolean;
}): Promise<Result<URL, Error>> {
	/** The URL to the site that will be proxied in a raw form. This will later be parsed. */
	const rawProxyUrlRes = getRequestUrl(
		reqUrl.origin,
		location.origin,
		clientUrl,
		reqUrl.pathname + reqUrl.search,
		isNavigate,
		isiFrame
	);
	if (rawProxyUrlRes.isErr())
		return fmtNeverthrowErr(
			"Error while getting the raw proxy URL required to get the final formatted proxy URL used for fetching the site under the proxy", rawProxyUrlRes.error.message
		);

	/** The URL to the site that will be proxied */
	let proxyUrl: URL;
	try {
		// Parse the request url to get the url to proxy
		return okAsync(new URL(rawProxyUrlRes.value));
	} catch (err: Error) {
		const event = err instanceof TypeError
			? "Failed to parse"
			: "Unknown error when trying to parse";
		return fmtNeverthrowErr(`${event} the raw proxy URL to get the final formatted proxy URL used for fetching the site under the proxy`, err.message);
	}
}