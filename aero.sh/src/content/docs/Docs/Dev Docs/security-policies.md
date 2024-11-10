---
title: Security Policies
description: A collection of documentation about Security Policies and how they are handled in aero
---

# CORS

Unlike other proxies that ignore the CORS policy by deleting them, aero abides by the intended security feature. These are necessary for sites to infer that the browser doesn't support modern security standards or a proxy is used.

## Testing

It does this by sending the unproxied request and checking for a CORS error.

If `corsMode` is unset, it will default to `testing,` but if URL encoding is set (`urlEncoder`), it will default to CORS Emulation.

> This is the only CORS method that doesn't use emulation

## Emulation

Although [Testing](#testing) is functional, it reveals the URL, which defeats the purpose of URL encryption or obfuscation that may be in place if you want to use CORS Emulation. set `corsMode` to `emulation`. It also has the added side effect of multiplying your request count by 2x. I will make the default mode emulation once it's complete.

# Sub-resource Integrity Emulation

This requires cooperation with the HTML rewriter or interceptor and the service worker.

TODO: Finish writing