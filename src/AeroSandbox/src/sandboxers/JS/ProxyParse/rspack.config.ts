import rspack from "@rspack/core";

const preProcessBundle = "AeroGel";

const plugins = [];
if (preProcessBundle)
	plugins.push(
		// I acknowledge that sometimes extra if checks may ruin the performance, so you can use replacements to avoid these checks
		new rspack.DefinePlugin({
			"config.trackPropertyChain": JSON.stringify(true),
			"config.trackProxyApply": JSON.stringify(true),
		})
	);

const config: rspack.Configuration = {
	entry: {
		keywordProcessor: "./src/keywordProcessor.ts",
		replaceKeywords: "./src/replaceKeywords.ts",
	},
	resolve: {
		extensions: [".ts"],
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				exclude: [/[\\/]node_modules[\\/]/],
				loader: "builtin:swc-loader"
			}
		]
	},
	output: {
		filename: "[name].js",
		path: "dist",
		iife: true,
		libraryTarget: "es2022"
	},
	target: ["webworker", "es2022"]
}

export default config;
