# SW-less runtime for proxies

TODO: Make this a part of AeroSandbox. It would also build bundles from it

[Dev Docs](./DEV.md)

This is a polyfill for all of the service workers APIs. It could also be used for hosting a proxy on sites that don't support external scripts, external files, or restrict service worker registering. Think of [domain fronting](../../docs/For%20devs/Domain%20Fronting.md). This will allow for countless opportunities for proxies in geographically restricted areas!

## Special bundles

### For webworkers

The webworker bundle will be made with [Partytown](https://partytown.builder.io)

### Server-only runtime for proxies

There will be special bundles for CF Workers due to them being nearly identical to the service worker API. I might also try to make it possible for the HTML and JS to be rewritten server-side on this platform, for providing better compatiblity.

> If you don't want to use CF Workers, that's fine! You will be able to run these in the standard runtimes through wrangler. I will provide middleware for routers in the other runtimes.

### sw-script

This will be a script you import that will define a web component at `swless:script` that you can use that extends HTMLScriptElement to make the script automatically run in it's own scope without needing the fake registration. You must provide the scope as an attribute `scope`. There will be an attribute called [secureMode](#secure-emulation-modes).

## Polyfilling for service workers as a whole

Create a module script, and import the object that is exported. This object will be nearly identical to navigator.serviceworker, so if you wanted to provide a polyfill you would do.

```js
import swless from "aero/swless";

navigator.serviceworker = swless;
```

> To ensure compliance with the service worker security policies you must add an exclusive service worker registration option called [secureMode](#secure-emulation-modes).

## Polyfilling for unsupported APIs in a service worker

```js
if (!caches) importScripts("aero/swless/cache");
if (!("addAll" in caches)) importScripts("aero/swless/cache/addAll");
```

## Bundling

It will build three bundles types:

- Webworker
  - swless.worker.worker.js
  - swless.worker.js
  - swless.worker.component.js
- Normal
  - swless.js
  - swless.component.js
- Server-only
  - server-only/swless.cfworkers.js

## Secure emulation modes

secureMode:

If you want

- to respect the "Service-Worker-Allowed" header, set it to "checkAllow"
- to respect the secure origin restriction, set it to "secureOrigin"
- both, set it to "both"

## Cons of SW-less

- Less performance, since you have to instantiate it in every tab
- Requires a lot of extra hooks into browser features
