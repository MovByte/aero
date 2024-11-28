/**
 * @module
 * This module is responsible for getting the url that will actually be fetched.
 * It does the extra processing needed for when using catch-all SW request URL interception
 */

import type { Result } from "neverthrow";
import { ok, err as nErr } from "neverthrow";

/**
 * Gets the url that will actually be fetched
 * @param - The origin of the site
 * @param - The origin of the service worker
 * @param - raw url after the proxy prefix
 * @param - path of the site
 * @param - the request is for the homepage
 * @param - the site is inside of an iFrame
 * @returns The url to proxy
 * @example
 * ...
 *
 * /** Used to determine if the request was made to load the homepage; this is needed so that the proxy will know when to rewrite the html files. For example, you wouldn't want it to rewrite a fetch request. *\/
 * const isNavigate = req.mode === "navigate" && ["document", "iframe"].includes(req.destination);
 *
 * ...
 *
 * /** If the client is an iframe. This is used for determining the request url. *\/
 * const isiFrame = req.destination === "iframe"
 *
 * /** The URL to the site that will be proxied in a raw form. This will later be parsed. *\/
 * const rawProxyUrlRes = getRequestUrl(
 * 	req.url.origin,
 * 	location.origin,
 * 	clientURL, // Retrieved from catch-all SW request URL interception
 * 	req.url.pathname + req.url.search,
 * 	isNavigate,
 * 	isiFrame
 * );
 *
 * if (rawProxyUrlRes.isErr())
 *  return ...;
 *
 * // I don't show any error catching here, but your handler should have it as a good practice
 * const proxyUrl = new URL(
 *  rawProxyUrlRes.value()
 * );
 */
export default class RequestUrlGetter {
	constructor(
		origin: string,
		workerOrigin: string,
	)
	getRequestURL(proxyUrl: URL)
}

export default function getRequestUrl(
	origin: string,
	workerOrigin: string,
	proxyUrl: URL,
	path: string,
	isHomepage: boolean,
	isiFrame: boolean
): Result<string, Error> {
	const noPrefix = path.split(self.config.prefix)[1];

	// If it is the first request, there is no must do any relative url checking
	if (typeof noPrefix === "string" && isHomepage) {
		let urlAfterPrefix: URL;
		try {
			urlAfterPrefix = new URL(noPrefix);
		} catch (err) {
			return nErr(
				new Error(
					`${err instanceof TypeError
						? "Failed to parse the URL after the prefix"
						: "Unknown error when trying to parse the URL after the prefix"
					}:${ERR_LOG_AFTER_COLON}${err}`
				)
			);
		}
		return ok(urlAfterPrefix.href);
	}

	// Not done making this type safe
	//
	// Don't hardcode origins
	const absoluteUrl = origin !== workerOrigin;

	if (absoluteUrl) return origin + path;
	else {
		const proxyOrigin = proxyUrl?.origin;
		//const proxyPath = proxyUrl?.pathname;

		if (noPrefix) {
			const retUrl = noPrefix;

			// FIXME: Correct relative urls that don't end with a slash; this is an edge case
			/*
			const proxyEndingPath = proxyPathSlashes?.at(-1);
			const proxyPathSlashes = proxyPath?.split("/");
			if (
				proxyPathSlashes?.at(-2) !== proxyOrigin &&
				proxyEndingPath.length > 0
			) {
				let noPrefixSplit = noPrefix?.split("/");

				$aero.log(proxyEndingPath);
				$aero.log(noPrefixSplit);

				noPrefixSplit.splice(
					noPrefixSplit.length - 1,
					0,
					proxyEndingPath
				);
				retUrl = noPrefixSplit.join("/");

				$aero.log(noPrefixSplit);
			}
			*/

			// TODO: Make this type safe

			const protoSplit = noPrefix.split(/^(https?:\/\/)/g);
			const noPrefixProto = protoSplit.slice(2).join();

			// TODO: Do this without searching for labels (There could be a directory with them or it could be an unqualified domain)
			// Determine if it is a path or a domain
			return noPrefixProto.split("/")[0].includes(".") || isiFrame
				? retUrl
				: `${proxyOrigin}/${noPrefixProto}`;
		} else return proxyOrigin + path;
	}
}
