import rewriteElement from "$src/sandboxers/HTML/util/rewriteElement";

new MutationObserver(mutations => {
	for (const mutation of mutations)
		if (mutation.type === "childList")
			for (const node of mutation.addedNodes)
				if (node instanceof HTMLElement) rewriteElement(node);
				else
					for (const attr of mutation.attributeName)
						if (mutation.target instanceof HTMLElement)
							rewriteElement(mutation.target, attr);
}).observe(document, {
	childList: true,
	subtree: true
});
