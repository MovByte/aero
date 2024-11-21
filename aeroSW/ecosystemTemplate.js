/**
 * @module
 * This module contains a generic template method, which is used in the two provided pm2 ecosystems. One for deno and the other for node/npm.
 */

const config = {
	buildForUnitTests: true
};

/** Generic */
export default runner => ({
	apps: [
		{
			name: "aero-dev-server",
			script: "dev-server/app.js"
		},
		{
			name: "aero-build-watch",
			script: runner,
			args: "run buildSW",
			env: {
				LIVE_BUILD: "true"
			}
		},
		{
			name: "aero-build-winterjs",
			script: runner,
			args: "run build",
			env: {
				LIVE_BUILD: "true",
				SERVER_ONLY: "winterjs"
			}
		},
		{
			name: "aero-build-cf-workers",
			script: runner,
			args: "run build",
			denv: {
				SERVER_ONLY: "cf-workers"
			}
		},
		{
			name: "aero-sandbox-build-watch",
			script: runner,
			cwd: "AeroSandbox",
			args: "run build",
			env: {
				LIVE_BUILD: "true",
				BUILD_MINIMAL: "true"
			}
		},
		{
			name: "aero-sandbox-for-unit-tests-build-watch",
			script: runner,
			cwd: "AeroSandbox",
			args: "run build",
			env: {
				TEST_BUILD: "true"
			}
		}
	]
});
