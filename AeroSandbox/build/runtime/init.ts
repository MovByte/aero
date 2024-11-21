/**
 * This file is the init for the giant AeroSandbox bundle
 */

import createAeroSandboxRuntime from "./createAeroSandbox";

{
	const buildConfig = require(BUILD_CONFIG_PATH);

	self.AeroSandbox = createAeroSandboxRuntime(buildConfig);
}
