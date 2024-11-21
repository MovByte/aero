import minifyHtml from "@minify-html/node";

/** The feature flags will be passed through in the RSPack config */
interface FeatureFlagsPassthrough {
	DEBUG: boolean;
}

/**
 * Minifies the HTML and JS in the injection bundle and templates the creation of it
 * @param pass 
 * @returns The formatted injection bundle (HTML)
 */
export default function fmtHTMLInjBundle({ DEBUG }: FeatureFlagsPassthrough) {
	const base = `
<!DOCTYPE html>
<head>
    <!-- Fix encoding issue -->
    <meta charset="utf-8">

    <!-- Favicon -->
    <!--
    Delete favicon if /favicon.ico isn't found
    This is needed because the browser caches the favicon from the previous site
    -->
    <link href="data:image/x-icon;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQEAYAAABPYyMiAAAABmJLR0T///////8JWPfcAAAACXBIWXMAAABIAAAASABGyWs+AAAAF0lEQVRIx2NgGAWjYBSMglEwCkbBSAcACBAAAeaR9cIAAAAASUVORK5CYII=" rel="icon" type="image/x-icon">
    <!-- If not defined already, manually set the favicon -->
    <link href="/favicon.ico" rel="icon" type="image/x-icon">

    <script src="{{BUNDLES_SANDBOX_INIT}}"></script>
    <script>
		{
			// Aero's global proxy namespace
			// The only things defined in here at this time are what is needed to be passed through the SW context to the client context. The rest is defined in the client when the aero bundle for the client is loaded.
			window.$aero = {
				...window.$aero,
				// Security
				sec: {{SEC}},
				// This is used to later copy into an iFrame's srcdoc; this is for an edge case
				init: {{IMPORT}},
				prefix: {{PREFIX}},
				searchParamOptions: {{SEARCH_PARAM_OPTIONS}},
			};
		}
    </script>
	<script src="{{BUNDLES_SANDBOX_END}}"></script>
	<script src="{{BUNDLES_LOGGER_CLIENT}}"></script>
	<script type="module">
		import aeroSandboxConfig from "{{BUNDLES_SANDBOX_CONFIG}}";
		if (!(AeroSandbox in self))
			$aero.logger.fatalErr("Missing the AeroSandbox declaration after importing the AeroSandbox bundle")
		const aeroSandbox new AeroSandbox({
			config: aeroSandboxConfig
		});
		// Takes in the storage key prefix you want
		aeroSandbox.registerStorageIsolators($aero.proxyNamespace)
		aeroSandbox.fakeOrigin();
		{{IMAGE_LOG}}
		$aero.logger.debug("Welcome to aero! Our GitHub repo is at {{BUNDLES_SANDBOX_END}}.")
		$aero.logger.debug("\\nAeroSandbox has been loaded and initialized: aero is ready to go!");
	</script>
    <script src="{{BUNDLES_SANDBOX_END}}"></script>
</head>
	`;
	return {
		cacheable: false,
		code: `module.exports = \`${minifyHtml.minify(Buffer.from(base), {
			keep_spaces_between_attributes: true,
			// TODO: Make this a real feature flag
			keep_comments: DEBUG
		}\`})`
	}
}