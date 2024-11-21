/**
 * This file is meant to be loaded with `val-loader` and is meant to be compile-time preprocessing for a string that is meant to be injected above the rest of the `rewrittenBody` from `rewriteResp`
 */

import minifyHtml from "@minify-html/node";

/** The feature flags will be passed through in the RSPack config */
interface FeatureFlagsPassthrough {
	DEBUG: boolean;
}

/**
 * Minifies the HTML and JS in the injection bundle and templates the creation of it
 * @param pass The feature flags that are passed through in the RSPack config
 * @returns The formatted injection bundle (HTML)
 */
export default function fmtHTMLInjBundle({ DEBUG }: FeatureFlagsPassthrough) {
	const base = /* xml */ `
<config>
{
	prefix: {{PREFIX}}
}
</config>
<?xml-stylesheet type="text/xsl" href="{{INTERCEPT_XSLT}}"?>
	`;
	return {
		cacheable: false,
		code: `module.exports = \`${minifyHtml.minify(Buffer.from(base), {
			keep_spaces_between_attributes: true,
			keep_comments: DEBUG
		})}\`})`
	};
}