import type { WebAppManifest } from "web-app-manifest";

import rewriteSrc from "$sandbox/shared/src";

/**
 * A module to rewrite Web App Manifests
 * @param - The original response body.=
 * @param - The URL of the proxy itself; used by the src rewriter
 * @see {@link https://w3c.github.io/manifest/#web-application-manifest}
 */
export default (body: string, proxyUrl: URL): string => {
    const json: WebAppManifest = JSON.parse(body);

    for (const prop of [
        "scope",
        "start_url",
        "background_color",
        "theme_color",
        "shortcuts",
        "screenshots"
    ]) {
        if (json[prop]) json[prop] = rewriteSrc(json[prop], proxyUrl.href);
    }

    for (const prop of ["icons", "screenshots"])
        if (json[prop])
            for (const item of json[prop])
                item.src = rewriteSrc(item.src, proxyUrl.href);

    for (const prop of ["related_applications", "prefer_related_applications"])
        if (json[prop])
            for (const app of json[prop])
                app.platform.url = rewriteSrc(app.platform.url, proxyUrl.href);

    return JSON.stringify(json);
};
