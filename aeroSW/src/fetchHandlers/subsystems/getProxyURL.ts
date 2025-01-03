// Neverthrow
import type { Result } from "neverthrow";
import { ok as nOk, err } from "neverthrow";
import { fmtNeverthrowErr } from "$shared/fmtErr";

// Utility
import RequestUrlGetter from "$util/getRequestUrl";

/**
 * Get the proxy URL to be used for fetching the site under the proxy.
 * Wraps `getRequestUrl` to get the raw proxy URL and then parse it.	
 * @param param0 The passthrough object needed to get the proxy URL
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
	/** The URL of t */
	clientUrl: string;
	isNavigate: boolean,
	isiFrame: boolean;
}): Promise<Result<URL, Error>> {
	const requestUrlGetter = new RequestUrlGetter(reqUrl.origin, location.origin);

	/** The URL to the site that will be proxied in a raw form. This will later be parsed. */
	const rawProxyUrlRes = requestUrlGetter.get(
		clientUrl,
		reqUrl.pathname + reqUrl.search,
		isNavigate,
		isiFrame
	);
	if (rawProxyUrlRes.isErr())
		return fmtNeverthrowErr(
			"Error while getting the raw proxy URL required to get the final formatted proxy URL used for fetching the site under the proxy", rawProxyUrlRes.error
		);

	/** The URL to the site that will be proxied */
	let proxyUrl: URL;
	try {
		// Parse the request url to get the url to proxy
		return nOkAsync((new URL(rawProxyUrlRes.value));
		// biome-ignore lint/suspicious/noExplicitAny: We know the type of the error
	} catch (err: any) {
		return fmtNeverthrowErr(`${err instanceof TypeError
			? "Failed to parse"
			: "Unknown error when trying to parse"} the raw proxy URL to get the final formatted proxy URL used for fetching the site under the proxy`, err.message);
	}
}