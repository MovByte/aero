---
title: Index
description: A collection of dev docs related to aero's API interception
---

# Glossary

- **API Interceptors**: These are ES6 Proxy objects whose job is to make the site as if the site is under another origin. This is where proxification is done.
- **Concealers**: These are API Interceptors whose only purpose is to hide the origin. These trick the site code into thinking that everything is normal. Concealers are not only needed to later on construct the correct requests, so that they can pass through the SW and be handled in the Bare Client, but they are also needed to prevent the site from thinking anything is abnormal. Our goal with web proxies is to emulate the original behavior of the site, so we need these for them to function.
- **Revealers**: These are the APIs or browser features that need to be concealed
  In this document, I describe what type of interceptors
- **Request URL Proxifier**: These are API interceptors whose jobs are to rewrite the source/content URLs to fit under the proxy in the case that there is no proxy SW or the Clients API is unavailable for whatever reason. If you have a regular SW proxy I recommend disabling these in AeroSandbox.

## Origin-related

TODO: This is a stub...

# Directory listing

- `concealers/`:The API interceptors whose purpose is to hide the origin.
- `events/`:The API interceptors that isolate the events to the proxy origin. It also handles clear events
- `location/`:The API interceptors that intercept redirection and conceal the origin
- `externalResourceLoc`:API interceptors that prevent the site from sharing URLs outside of the proxy. I recommend keeping these off by default because the user might want to visit these sites later in their browsing journey off of the prox.
- `req/`:The API interceptors for requests.
- `storage/`:The API interceptors that isolate the storage into the proxy origin.
- `worker/`:The code to register nested SWs and API interceptors for workers.
