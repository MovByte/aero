import type { APIInterceptor } from "$types/apiInterceptors.d.ts";

import { proxyLocation, upToProxyOrigin } from "$aero/src/shared/proxyLocation";

// Prevent detection by instanceof or attempting to overwrite it
const inheritedObject = {};
Object.defineProperty(this, "inheritedObject", {
    writable: false,
    configurable: false
});
Reflect.setPrototypeOf(inheritedObject, Object.getPrototypeOf(location));

const wrap = (url: string) => $aero.config.prefix + url;

const locationProxy = Proxy.revocable(inheritedObject, {
    get(target, prop) {
        function internal() {
            if (typeof target[prop] === "function") {
                // @ts-ignore
                // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                const props: any = {
                    toString: () => proxyLocation().toString()
                };

                // These properties below are not defined in workers
                if ("assign" in location)
                    props.assign = (url: string) =>
                        location.assign(wrap(url));
                if ("replace" in location)
                    props.replace = (url: string) =>
                        location.replace(wrap(url));

                return prop in props && prop in location
                    ? props[prop]
                    : target[prop];
            }

            const fakeUrl = proxyLocation;

            /**
             * `ancestorOrigins` is only found in Chrome
             */
            const customProps = {
                // TODO: Rewrite
                //ancestorOrigins: location.ancestorOrigins,
            };

            if (prop in customProps) return customProps[prop];

            if (prop in fakeUrl) return fakeUrl[prop];

            return location[prop];
        }

        const ret = internal();

        return ret;
    },
    set(target, prop, value) {
        if (
            prop === "pathname" ||
            (prop === "href" && value.startsWith("/"))
        )
            target[prop] = upToProxyOrigin + value;
        else target[prop] = value;

        return true;
    }
});

export default [{
    proxifiedObj: locationProxy,
    globalProp: `["<proxyNamespace>"].sandbox.proxifiedLocation`
}, {
    globalProp: `document.location`,
    modifyObjectProperty: (ctx) => {
        Object.defineProperty(document, "domain", {
            get: (): void => globalThis[ctx.globalNamespace].sandbox.proxifiedLocation.hostname
        });
    }
}, {
    globalProp: `document.location`,
    modifyObjectProperty: (ctx) => {
        Object.defineProperty(document, "domain", {
            get: (): void => globalThis[ctx.globalNamespace].sandbox.proxifiedLocation.domain
        });
    }
}] as APIInterceptor[];
