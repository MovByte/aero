# StorageIsolator

This will be a port of the contextual identities API from Firefox to anywhere. The only catch is that you must implement AeroSandbox built with the StorageIsolator API feature flags on.

Normally, in proxy mode: the storage keys are prefixed with the proxy origin like `<PROXY ORIGIN>_<ORIGINAL KEY>`, this is similar but it will make it `<COOKIE_STORE_ID>_<PROXY_ORIGIN>?_<ORIGINAL_KEY>`.

## Uses for this

- Implement a web containers extension, similar to how Firefox allows for web containers in their extension APIs. I will personally, use this in my extension emulator middleware in my Browser Ports project. I also plan to use these same APIs to port [Firefox Multi-Account Containers](https://addons.mozilla.org/en-US/firefox/addon/multi-account-containers) to other browsers. It is this very extension that I found myself missing when I switched from Firefox-based browsers, to Chromium-based browsers, and I'm not alone with this sentiment.


## Contextual Identities

...

### APIs

Assume storageIsolator is the default-exported object of `contextualIdentities.ts`

#### From the Firefox Web Extensions API

- `storageIsolator.webExtsAPI`: Is an object that contains a full replica of the webExtsAPI that are in the Firefox browser. [See](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/contextualIdentities).

TODO: List the rest and how I will implement them...

#### My APIs

- Normally, to use contextual identities you need to create a tab window in Chromium with one. In here, you need redirect your user to with `window.open`: `/go/contextualIdentities/inContainer/<ORIGINAL PROXY URL>?container=<COOKIE STORE ID>`. But I will make a function on the `storageIsolator` object to make this easier, which functions similarly to `window.open`

`openWindowWithContextualIdentity(url, COOKIE STORE ID)`

### SW HTTP APIs

These APIs will be created

#### `/go/contextualIdentities/inContainer/<PROXY URL>?container=<COOKIE STORE ID>` (GET) - Does the same thing as the normal proxy route `/go/<PROXY URL>`, but it makes use of the contextual id corresponding to the cookie store id provided by the search param `container`

#### `/go/contextualIdentities/create` (GET) - Returns a JSON response with the new COOKIE STORE ID

#### `/go/contextualIdentities/getAll` (GET) - Returns a JSON response with the all of the COOKIE STORE ID

#### `/go/contextualIdentities/destroy` (GET) - Returns a JSON response with a success or faliure if the COOKIE STORE ID doesn't exist