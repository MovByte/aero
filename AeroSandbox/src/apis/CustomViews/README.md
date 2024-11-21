# CustomViews from AeroSandbox

> This document is highly incomplete and will change. Not everything is documented yet.

I got the name, because the functionality is similar to the [webview tag in Electron]() (not to be confused with the ones in Chrome and Android), but without the unrealistic browser controls (such as dev tools) and a window proxy built with IPC. The window proxy is why it is called a *Control*View an not a WebView

## Security features that are changed in `<controlview>` compared to the original `<webview>` tags in Electron

### No longer default

These security features can still be enabled, but they aren't on by default

- Block [mixed content](https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content)

### No possible

- Limiting plugins: Yes, we can tell what plugins are being used through the deprecated property `navigator.plugins`, but there is no way to disable them. The only reason why Electron is able to do it is because it has full control over the Chromium binary.

## The actual custom elements and their differences

### ControlView `controlview`

### ElectronControlView `electron-controlview`

Assuming you want to retain the defaults of the security features, you can still get this with this custom element.

### ElectronWebView `electron-webview`

This custom element will do the same thing as [ElectronControlView](#electroncontrolview-electron-controlview), but it doesn't have the window proxy. This is useful, for example, if you wanted to make an Electron port for a WebOS, this would help you get one step closer to it. This would be best for making accurate Electron `<webview>` ports, since they obviously wouldn't have anything like window proxies.


## Limitations compared to iframes

ControlView is based off of the iframe, so it is mostly compatible with what you can do in the iframes, but there are some imposed limitations for security reasons. TODO: List...

## Tag Attributes

- `enableIPC`: This must be explicitly enabled, and when it does it allows messages to be sent between the parent and the child. This is a boolean option.
- `respectFrameControls`: By default, the ControlView ignore . There isn't much reason to respect a site's choice to. Boolean or ...
- `allowpopups`: Defaults to true. This would prevent the site from using `alert(...)` and `prompt(...)`

### Differences from iframes

It inherits most of the attributes from the iframe, so those won't be listed here, rather I list those that are removed or modified from their native functionality.


### [Electron ports](https://www.electronjs.org/docs/latest/api/webview-tag#tag-attributes)

- [preload](https://www.electronjs.org/docs/latest/api/webview-tag#preload) - This internally add a query parameter `controlViewPreload=<SCRIPT>`, which in the SW.

> Remember, anything that uses a SW requires the AeroSandbox SW additions import

- [httpreferrer](https://www.electronjs.org/docs/latest/api/webview-tag#httpreferrer)
- [disablewebsecurity]: In the docs for the attribute, it is quite vague and doesn't explain what exactly is disabled, however information can be found [here](https://www.electronjs.org/docs/latest/tutorial/security#6-do-not-disable-websecurity). It explains that enabling this, will disable the same-origin policy. Additionally, it refers to `allowRunningInsecureContent`, which isn't explained in that section, but two sections after that [here](https://www.electronjs.org/docs/latest/tutorial/security#6-do-not-disable-websecurity); this means that enabling `disablewebsecurity` will allow mixed-content, which isn't allowed by default on.
- [partition](https://www.electronjs.org/docs/latest/api/webview-tag#partition): This is similar to the storage isolation features in AeroSandbox, and will use the same storage isolation backend that AeroSandbox uses to power it.
- [allowpopups]() - ...
- [webpreferences](https://www.electronjs.org/docs/latest/api/webview-tag#webpreferences)

## APIs

A lot of these are inspired by or reimplementations of the corresponding APIs in Electron

[ControlView.loadURL(url[, options])](https://www.electronjs.org/docs/latest/api/webview-tag#webviewloadurlurl-options) - This will work by having a route on the SW, where the options are passed through into the query params and the SW will issue another `301` Location redirect. This would in the custom elements send a message to the child to issue this said redirect.. This would require your SW to support the implementation.
`ControlView.getURL()`
`ContorlView.setURL()`
`ControlView.getURLHistory()`
[ControlView.clearHistory()](https://www.electronjs.org/docs/latest/api/webview-tag#webviewclearhistory)
[ControlView.goBack()](https://www.electronjs.org/docs/latest/api/webview-tag#webviewgoback)
[ControlView.goForward()](https://www.electronjs.org/docs/latest/api/webview-tag#webviewgoforward)
`ControlView.setUserAgent(userAgent)`
`ControlView.insertCSS(css, stealthMode)`

`ControlView.setClientHints(clientHints)` - This will set only the client hints

## Events (parent)

* `onurlchange`: This requires code inside of all the location hooks to work
* `onhashchange` (proxied to the parent)