// FIXME: I have no idea why when I make this a library it doesn't work in the unit test builds
import type {
    APIInterceptor,
    // ExposedContextsEnum,
    proxifiedObjGeneratorContext
} from "../../../../types/apiInterceptors";
// biome-ignore lint/style/useEnumInitializers: <explanation>
enum ExposedContextsEnum {
    dedicatedWorker,
    sharedWorker,
    audioWorklet,
    animationWorklet,
    layoutWorklet,
    sharedStorageWorklet,
    paintWorklet,
    serviceWorker,
    window
}

import type JSRewriter from "$src/sandboxers/JS/JSRewriter";

// These interceptors conceal `location` and accessing `location` from the window object. The window proxy is injected directly into the `this` that IIFE that AeroSandbox is powered by.

// Init
/*
const proxyNamespace = window["<proxyNamespace>"];
proxyNamespace.aeroGel = {};
const aeroGel = proxyNamespace.aeroGel;
aeroGel.fakeVars = {};

\/*
// Scope Checking. This is for DPSC. TODO: Make DPSC configurable on AST parsing and only use it when in a block scope.
$aero.check = val => (val === location ? $location : val);
*\/

aeroGel.fakeVarsStore = new Map<
    string,
    {
        value: string;
        isConst: boolean;
    }
>();

const fakeVarsEmulationGetter = {
    get(_target, prop) {
        if (aeroGel.fakeVarsStore.has(prop))
            return aeroGel.fakeVarsStore.get(prop.value);
        return undefined;
    }
};

aeroGel.fakeVarsLet = new Proxy(aeroGel.fakeVars, {
    ...fakeVarsEmulationGetter,
    set(_target, prop, value) {
        aeroGel.fakeVarsStore.set(prop, {
            value
        });
        return true;
    }
});
aeroGel.fakeVarsConst = new Proxy(aeroGel.fakeVars, {
    ...fakeVarsEmulationGetter,
    set(_target, prop, value) {
        if (!aeroGel.fakeVarsStore.has(prop)) {
            aeroGel.fakeVarsStore.set(prop, {
                value,
                isConst: true
            });
            return true;
        }
        return false;
    }
});
*/

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
let fakeValueForProxyNamespace: any = null;
const windowProxyInterceptor: APIInterceptor = {
    proxifiedObj: (ctx: proxifiedObjGeneratorContext) => {
        // TODO: Don't reveal $aero
        if (
            Object.values(ctx.specialInterceptionFeatures).includes("aeroGel")
        ) {
            // Prevent detection by checking if the fakeWindow was inherited from the real window.
            const winProto = Object.getPrototypeOf(window);
            return new Proxy(window, {
                get(target, prop) {
                    if (prop === "__proto__") return winProto;
                    if (prop === "location")
                        return window["<proxyNamespace>"].sandbox.proxifiedLocation;
                    if (typeof target[prop] === "function")
                        return target[prop].bind(window);
                    // Don't allow access to the proxy namespace so emulate the property
                    if (prop === "<proxyNamespace>") {
                        if (fakeValueForProxyNamespace !== null)
                            return fakeValueForProxyNamespace;
                        return undefined;
                    }
                    return target[prop];
                },
                set(target, prop, value) {
                    if (prop === "<proxyNamespace>") {
                        fakeValueForProxyNamespace = value;
                        return true;
                    }
                    return Reflect.set(target, prop, value);
                },
                getPrototypeOf(_target) {
                    return () => winProto;
                },
                // Conceal the proxy namespace by preventing detection from the "in" operator
                has(target, key) {
                    return (
                        key !== "<proxyNamespace>" && Reflect.has(target, key)
                    );
                }
            });
        }
    },
    globalProp: `["<proxyNamespace>"].sandbox.js.proxifiedWindow`,
    exposedContexts: ExposedContextsEnum.window
};

// @ts-ignore
const wrapScript: JSRewriter.wrapScript = `["<proxyNamespace>"].sandbox.js.wrapScript`;

const evalInterceptors: APIInterceptor[] = [
    {
        proxifiedObj: Proxy.revocable(Function, {
            construct(target, args) {
                let [func] = args;

                let bak = "";

                if (typeof func === "string") {
                    bak = func;
                    func = wrapScript(func);
                } else if (
                    typeof func === "function" &&
                    !(
                        func.toString() !==
                        `function ${func.name}() { [native code] }"`
                    )
                ) {
                    bak = func.toString();
                    func = wrapScript(func.toString());
                }

                args[0] = func;

                const inst = Reflect.construct(target, args);

                // Use Object.defined to conceal the getter
                inst.bak = bak;

                // Hide the changes from the site
                inst.toString = () => bak;

                return inst;
            }
        }),
        globalProp: "Function"
    },
    {
        proxifiedObj: Proxy.revocable(eval, {
            apply(target, that, args) {
                args[0] = wrapScript(args[0]);

                return Reflect.apply(target, that, args);
            }
        }),
        // You can't rewrite eval in strict mode
        globalProp: `["<proxyNamespace>"].sandbox.js.eval`
    }
];

const locationConcealers: APIInterceptor[] = [
    {
        proxifiedObj: Proxy.revocable(Object.getOwnPropertyDescriptor, {
            apply(target, that, args) {
                let [obj, prop] = args;

                if (obj === location || (obj === window && prop === "location"))
                    obj = window["<proxyNamespace>"].sandbox.proxifiedLocation;

                args[0] = obj;

                return Reflect.apply(target, that, args);
            }
        }),
        globalProp: "Object.getOwnPropertyDescriptor",
        exposedContexts: ExposedContextsEnum.window
    },
    {
        proxifiedObj: Proxy.revocable(Reflect.set, {
            apply(target, that, args) {
                let [theTarget, prop, value] = args;

                if (theTarget === window)
                    // @ts-ignore
                    theTarget = ["<proxyNamespace>"].sandbox.js.proxifiedWindow;
                if (theTarget instanceof Location) {
                    window["<proxyNamespace>"].sandbox.proxifiedLocation[prop] = value;
                    return;
                }
                return Reflect.apply(target, that, args);
            }
        }),
        globalProp: "Reflect.set"
    },
    {
        proxifiedObj: Proxy.revocable(Reflect.get, {
            apply(target, that, args) {
                let [theTarget, theProp] = args;

                if (theTarget === Window)
                    // @ts-ignore
                    theTarget = ["<proxyNamespace>"].sandbox.js.proxifiedWindow;
                if (theTarget instanceof Document)
                    if (theProp === "location")
                        return window["<proxyNamespace>"].sandbox.proxifiedLocation;
                if (theTarget instanceof Location)
                    return window["<proxyNamespace>"].sandbox.proxifiedLocation;
                [theProp];
                return Reflect.apply(target, that, args);
            }
        }),
        globalProp: "Reflect.get"
    }
];

const ProxyProxyInterceptor: APIInterceptor = {
    /**
     * Fixes `that` in the Proxy handlers being used to reveal the window if the target in the Proxy object is a property on the windowon
     * You could solve this issue with EST parsing, but that would make JS parsing way slower than it is now, so I opted to use the same window proxy object that AeroGel already uses
     * EST parsing is flawed compared to AeroGel because it is exponentially  `n` times more expensive to keep track of what will happen in the future, which would be a part of the solution for many UV's JS rewriting escapes. That is why the Discord bundle takes so long to rewrite using full-parse methods.
     */
    proxifiedObj: (ctx: proxifiedObjGeneratorContext) => {
        if (
            Object.values(ctx.specialInterceptionFeatures).includes("aeroGel")
        ) {
            return new Proxy(Proxy, {
                construct(target, args) {
                    let [pTarget, handler] = args;

                    if ("apply" in handler) {
                        const originalApplyHandler = handler.apply;
                        args[1] = (_target, _that, pArgs) => {
                            // _that is null
                            // _target doesn't work
                            const pTargetBak = pTarget;
                            pTarget = () => new Error().stack;
                            const revealingStackError = pTarget();
                            // Restore functionality of the target method
                            pTarget = pTargetBak;
                            // Get the parents that contain the method
                            const targetName = pTarget.name;
                            const parentObjTree = [
                                ...revealingStackError.matchAll(
                                    /Error\\n\s\s\s\sat\s([a-zA-Z.]*)/
                                )
                            ][0].split(`.${targetName}`)[0];
                            let pThat = window[parentObjTree];
                            if (pThat === window)
                                // @ts-ignore
                                pThat = windowProxyInterceptor.proxifiedObj;
                            return originalApplyHandler(pTarget, pThat, pArgs);
                        };
                    }

                    return Reflect.construct(target, args);
                }
            });
        }
    },
    globalProp: "Proxy",
    insertLevel: 1
};
const EventTargetInterceptor: APIInterceptor = {
    /**
     *  If you intercept `EventTarget.prototype.addEventListener` with a Proxy object to try to trap the window events, once a window event is triggered, `event.source` can be used to get the window object. This API interceptor solves that problem by setting `event.source` to the proxified object.
     */
    proxifiedObj: ctx =>
        new Proxy(EventTarget.prototype.addEventListener, {
            apply(target, that, args) {
                const [_eventName, handler] = args;

                // TODO: Use this same interceptor to implement catchall event interception to prevent using multiple proxies for API Interception

                if (
                    Object.values(ctx.specialInterceptionFeatures).includes(
                        "aeroGel"
                    )
                ) {
                    args[1] = event => {
                        // @ts-ignore
                        event.source = ProxyProxyInterceptor.proxifiedObj(ctx);
                        handler(event);
                    };
                }

                return Reflect.apply(target, that, args);
            }
        }),
    globalProp: "EventTarget.prototype.addEventListener"
};

export {
    evalInterceptors,
    locationConcealers,
    windowProxyInterceptor,
    ProxyProxyInterceptor,
    EventTargetInterceptor
};
