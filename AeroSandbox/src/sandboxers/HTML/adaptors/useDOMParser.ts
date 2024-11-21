import rewriteElement from "$sandbox/HTML/shared/rewriteElement";

export default function (domText: string) {
	const dom = new DOMParser().parseFromString(domText, "text/html");
	for (const childNode of dom.childNodes)
		if (childNode instanceof HTMLElement) rewriteElement(childNode);
	// Convert back to string
	return dom.documentElement.innerHTML;
}
