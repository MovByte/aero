---
title: How to migrate from UV
---

# The server

## Express

1. Go to the JS file with your Express server app

2. Underneath

```js
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
```

add

```js
import { default as aeroPath, aeroExtrasPath } from "aero-proxy";
```

or (if you are not following step 4)

```js
import aeroPath from "aero-proxy";
import aeroSandboxPath from "aero-sandbox/path.js";
```

3. Underneath

```js
app.use("/uv/", express.static(uvPath));
```

add

```js
app.use("/aero/", express.static(aeroPath));
app.use("/aero/extras/", express.static(aeroExtrasPath)); // You only need to import this if you are using handleWithExtras
app.use("/aero/sandbox/", express.static(aeroSandboxPath));
```

4.

add

```js
app.use("/", express.static(aeroExtrasPath))
```

before any of your `app.use` calls

> This is optional, but it gives aero cleaner error reporting, so it is recommended

# The proxy site

1. Go to your SW file (the main one in the root of your static folder that you initially registered, not the UV handler)
2. Look at `examples/swWithSwitcher.js` for "inspiration" (copy it and modify the const variables on the top to your liking)
3. Make a proxy switcher and when a change in the dropdown for the proxy is observed. See `examples/proxySwitcherFrontend.js` for "inspiration" (copy it and modify the const variables on the top to your liking)
4. Add your config to `<YOUR STATIC DIR>/<YOUR AERO DIR>/config.js`. See `examples/config.js` for "inspiration" (copy it and modify the config fields to your liking)
5. Add your AeroSandbox config to `<YOUR STATIC DIR>/<YOUR AERO DIR>/<YOUR AERO SANDBOX DIR>/config.js`
