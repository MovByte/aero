# Dev Docs

## Implementation

I will write a library with two exports: importScripts and self.addEventListener:

- **importScripts** - Emulates the importScripts in workers, by using import() in a polyfill feature. This isn't needed if it is being ran in a webworker.
- **addEventListener** - This won't actually be a real event listener. This will set a map on ([the hidden variable](../AeroSandbox/docs/JS/Scoping.md#the-hidden-variable)).swless.handlers. Emulation of the event handlers will work by intercepting APIs that send HTTP requests and running the handler back on the response. It would require data, to be converted from, to a Response, and back, to be called inside of the original handler.
