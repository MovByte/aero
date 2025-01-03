/**
 * This isn't a usual standard because it is from a standards organization that is a one-time thing, but they seem to have abandoned their docs page. However, the standard is one of the most widely used standards on the web, and OpenSearch will continue to be used until the end of the web.
 * You can find the docs here - @see https://github.com/dewitt/opensearch/blob/master/opensearch-1-1-draft-6.md
 * 
 * @see https://www.chromium.org/tab-to-search/
 * @see https://developer.mozilla.org/en-US/docs/Web/OpenSearch
 * This rewriter shouldn't be used if the feature flag `REWRITE_OPENSEARCH` is disabled
 * 
 * Examples
 * @see https://ladsweb.modaps.eosdis.nasa.gov/tools-and-services/lws-classic/xml/opensearch.xml
 */

import { type ResultAsync, okAsync as nOkAsync, errAsync as nErrAsync } from "neverthrow";

import { parseDocument } from "htmlparser2";

async function rewriteOpensearch(body: string): Promise<ResultAsync<string, Error>> {
	const doc = parseDocument(body, {
		xmlMode: true
	});

	doc.childNodes.forEach(node => node.)
	const urlElement = doc.children.find(childEl => childEl.name === "url");
]						