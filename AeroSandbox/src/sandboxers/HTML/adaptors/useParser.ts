import { parseDocument } from "htmlparser2";
// This runs in the SW, so it must not use any custom import paths
import rewriteElement from "../shared/rewriteElement";

export default function (domText: string) {
	const dom = parseDocument(domText);
	for (const childNode of dom.childNodes) {
		if (childNode.type === "tag") {
			// Close enough for our use cases
			// @ts-ignore
			rewriteElement(childNode);
		}
	}
}
