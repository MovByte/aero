import { defineConfig } from "@playwright/test";

import devServerConfig from "../../../dev-server/config.js";

export default defineConfig({
	reporter: "line",
	use: {
		baseURL: `http://localhost:${devServerConfig.port}`
	},
	webServer: {
		command: "cd ../../.. && pm2 run ecosystem.config.js",
		url: baseURL,
		reuseExistingServer: !process.env.CI
	}
});
