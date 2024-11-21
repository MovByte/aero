# TODOs

- Use the types for the service worker specifically in this `aeroSWAdditions` folder and nowhere else in `AeroSandbox`

## Specific additions

- Implement the backend in `self.fetchEventMiddleware` needed for `<controlview>.loadURL`. Internally when that method is called, it will send a message to the child (iFrame) and the child will redirect to the proxy location URL. Instead of it redirecting to `/go/<ENCODED PROXY? URL>`, it will have be an addition to the original prefix on the SW. Let's say the SW's prefix was `/go/`, loadURL would redirect the iframe's location to `/go/<ADDITIONAL PREFIX>/<ENCODED? PROXY URL>`. This is how it would know to add on the data in the query params. What this middleware will do is overwrite `event.request.url` to remove the additional prefix and modify the headers accordingly to the passed in params.