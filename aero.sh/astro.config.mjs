import { resolve } from "node:path";

// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";

import starlight from "@astrojs/starlight";
import starlightTypeDoc, { typeDocSidebarGroup } from "starlight-typedoc";
import catppuccin from "starlight-theme-catppuccin";

//import { viteStaticCopy } from "vite-plugin-static-copy";

// https://astro.build/config
export default defineConfig({
	site: "https://aero.sh",
	// TODO: Make it read `tsconfig.json` instead
	vite: {
		resolve: {
			alias: {
				"@": resolve("./src")
			}
		}
	},
	integrations: [
		react(),
		/*
		tailwind({
		applyBaseStyles: false,
		}),
		*/
		starlight({
			title: "aero/AeroSandbox docs",
			logo: {
				src: "../aero.webp" // TODO: Use an SVG instead
			},
			//favicon: "../aero.webp",
			plugins: [
				catppuccin({ dark: "mocha-mauve", light: "latte-mauve" })
				/*
				starlightTypeDoc({
					//entryFiles: ["../src/**\/*.ts"],
					//tsconfig: "../tsconfig.json",
				})
        */
			]
		})
	],
	server: {
		port: 2525
	},
	devToolbar: {
		enabled: false
	}
});
