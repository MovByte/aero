/** @type {Partial<import('typedoc').TypeDocOptions>} */
const config = {
	entryPoints: [
		"./src/this/handleSW.ts"
		//"./src/AeroSandbox/build/runtime/init.ts"
	],
	plugin: [
		"typedoc-plugin-markdown",
		"@typhonjs-typedoc/typedoc-theme-dmt",
		"@typhonjs-typedoc/ts-lib-docs/typedoc/ts-links/dom/2023",
		"@typhonjs-typedoc/ts-lib-docs/typedoc/ts-links/esm/2023"
	],
	out: "typedoc"
};

export default config;
