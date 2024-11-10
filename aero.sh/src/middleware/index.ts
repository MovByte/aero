import { defineMiddleware } from "astro:middleware";

import { readFile } from "node:fs/promises";

export const onRequest = defineMiddleware(async (ctx, next) => {
	try {
		const icon = await readFile(new URL("../../.../icon.svg", import.meta.url), "utf8");
		if (ctx.url.pathname.startsWith("/icon.svg"))
			return new Response(icon, {
				headers: {
					"content-type": "image/svg+xml"
				}
			});
	} catch (err) {
		console.error(`Failed to read the aero icon: ${err}`);
		return next();
	}
	return next();
})