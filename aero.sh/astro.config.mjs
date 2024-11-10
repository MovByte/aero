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
			title: "aero",
			logo: {
				src: "../aero.webp" // TODO: Use an SVG instead
			},
			//favicon: "../aero.svg",
			plugins: [
				catppuccin({ dark: "mocha-mauve", light: "latte-mauve" })
				/*
				starlightTypeDoc({
					//entryFiles: ["../src/**\/*.ts"],
					//tsconfig: "../tsconfig.json",
				})
        */
			],
      sidebar: [
        {
          label: "Nav",
          items: [
            { label: "About", link: "/" },
            { label: "Proxy", link: "/proxy" },
            { label: "Demos", link: "/demos" },
            { label: "Stats", link: "/stats" },
          ],
        },
        {
          label: "Docs",
          autogenerate: { directory: "Docs" }
        }
      ],
      social: {
        github: "https://github.com/vortexdl/aero"
      }
		})
	],
	server: {
		port: 2525
	},
	devToolbar: {
		enabled: false
	}
});
