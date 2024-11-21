export type onAttrHandler = (
	// biome-ignore lint/suspicious/noExplicitAny: TODO: Make HTMLElement interface
	el: any,
	newVal: string,
	oldVal?: string
) => string;

export type htmlRule = {
	tagName?: string;
	mustBeNew?: boolean;
	onAttrHandlers?: {
		[attr: string]: onAttrHandler | "rewrite-src" | "rewrite-html-src";
	};
	// biome-ignore lint/suspicious/noExplicitAny: TODO: Make HTMLElement interface
	onCreateHandler?: (el: any) => void;
};
