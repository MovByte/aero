/*
import type { APIInterceptor } from "$aero/types/apiInterceptors";

import upToProxyLocation from "sandbox/src/util/upToProxyLocation";

import { afterPrefix } from "$shared/afterPrefix";
*/

/*
There are 3 ways to detect proxies using the Performance API
Using entry.name to expose the url
If the site was rewritten or the headers were modified, the size would be different than what is intended. You can think of this as a form of hash checking
If you make a request to two different proxy origins on the site that are both cached and one has the Clear-Site-Data clearing both proxy origins, the proxy can be detected
*/

// FIXME:

/*
const resInfo = new Map<string, boolean>();

const broadcast = new BroadcastChannel("resCached");

// Detect if cache is cached
// TODO: Broadcast this info on the sw
broadcast.onmessage = event => {
    const { url, cached } = event.data.payload;

    resInfo.set(url, cached);
};

function isCached(url: string) {
    let res = resInfo.get(url);

    return res ? url in res : false;
}

async function getHeader(url: string, headerName: string) {
    const resp = await fetch(url);

    return resp.headers[headerName];
}

async function getBodySize(url: string) {
    return await getHeader(url, "x-aero-size-body");
}

export default {
    globalProp: "performance.getEntries",
    proxifiedObj: new Proxy(performance.getEntries, {
        apply(target, that, args) {
            let entries: PerformanceEntryList = Reflect.apply(
                target,
                that,
                args
            );

            return (
                entries
                    // Hide aero's injections
                    .filter(
                        entry =>
                            !entry.name.startsWith(location.origin + $aero.config.prefix)
                    )
                    .map(async entry => {
                        if (entry.name) {
                            Object.defineProperty(entry, "name", {
                                value: afterPrefix(entry.name),
                                writable: false,
                            });

                            // FIXME: Fix this
                            const size = target[prop];

                            const resCached = isCached(url);
                            const resCrossOrigin = !url.startsWith(
                                upToProxyOrigin($aero.prefix, $aero.logger)
                            );
                            const isZero =
                                resCached ||
                                resCrossOrigin ||
                                "timing" in $aero.sec.headers;

                            Object.defineProperty(entry, "transferSize", {
                                value: isZero
                                    ? 0
                                    : await getHeader(
                                        url,
                                        "x-aero-size-transfer"
                                    ),
                                writable: false,
                            });
                            Object.defineProperty(entry, "encodedBodySize", {
                                value: async () => {
                                    if (isZero) return 0;

                                    const decodeSize = prop.decodedBodySize;

                                    // There is no encoding
                                    if (size === decodeSize)
                                        return await getBodySize(url);
                                    else
                                        return await getHeader(
                                            url,
                                            "x-aero-size-encbody"
                                        );
                                },
                                writable: false,
                            });
                            Object.defineProperty(entry, "decodedBodySize", {
                                value: async () => {
                                    if (isZero) return 0;

                                    return await getBodySize(url);
                                },
                                writable: false,
                            });
                        }

                        return entry;
                    })
            );
        },
    })
} as APIInterceptor;
*/