---
title: Common misconceptions
description: A document intended to warn new proxy devs about common misconceptions they may have before they get started
---

- Server-only - When I say this, I usually refer to running the SW code in the web server instead.
- [writable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty#writable) vs [configurable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty#configurable)
- Backend - The code that the _user_ doesn't see. Usually, this refers to using different implementations of the same thing. For example, you may refer to a bare server as a bare backend. This is because there are varying implementations to the standard; however, bare is not a backend proxy server but the _bare_ proxy itself.
- Proxy sites shouldn't be called proxies
- Proxify - refers to making a browser feature work on the proxy and using proxy as a verb for the gerund of the actual network request proxying.
- Don't confuse web proxies with HTTP proxies. Web proxies give you control over the sandboxing and don't require any configuration. If you try using an HTTP proxy over Aero, the data won't go through that proxy. It's like how using VPNs behind TOR breaks security. You must set up the HTTP proxy on the bare server, preferably through a custom implementation.
