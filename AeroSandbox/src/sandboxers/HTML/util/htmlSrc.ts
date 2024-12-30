import sharedConfig from "$util/sharedConfig";

import rewriteSrc from "$src/shared/src";
import { proxyLocation } from "$util/proxyLocation";
import proto from "$util/proto";

/**
 * Extends src rewriting for processed html urls
 * @param - The url to rewrite
 * @param - If its to rewrite an iFrame src
 */
export default (src: string, isIFrame?: boolean): string => {
	// TODO: rewrite
	if (src instanceof Blob) return src;

	const url = proto.get(
		src.replace(new RegExp(`^(${location.origin})`, "g"), "")
	);

	if (/^javascript:/g.test(url))
		return sharedConfig("rewriters").js.wrapScript(url);
	if (/^data:/g.test(url)) {
		if (isIFrame) {
			const exp = /^data:text\/html(;base64)?,/g;

			const matches = [...url.matchAll(exp)];

			if (matches.length === 2)
				return matches[0].replace(
					exp,
					`$&${encodeURIComponent(
						$aero.init + decodeURIComponent(url)
					)}`
				);
			if (matches.length === 1)
				return `$&${btoa($aero.init + atob(url))}`;
		}
		return url;
	}
	if (
		// Ignore about:blank
		/^about:/g.test(url) ||
		// Don't rewrite again
		new RegExp(`^(${sharedConfig("prefix")})`).test(url)
	)
		return url;

	return rewriteSrc(url, proxyLocation().href);
};
