---
title: Request Interception
description: This doc writes about Request Interception in aero's SW
---

# HTTP

Interception proxies primarily intercept HTTP requests through a service worker, where the request is modified and eventually sent using a [bare client](https://github.com/tomphttp/bare-client). The response will be rewrote and cache will be emulated. This prevents the need to hook into code that previously needed to be rewrote to redirect requests saving time and resources.

## How the response is rewrote (in psuedocode)

If

- the request is to navigate to a website (to HTML, XHTML, or XML with XSLT transforms), the sandbox injects aero's sandboxing library
- the request is to a JS file, it is jailed (NOTE: the file link is missing)
- the request is to a cache manifest, the paths are rewrote with the html src rewriter being reused. That is why it is seperate from rules.ts, where most of the attribute rewriters are stored

## Emulation required

- [Cache emulation](./Cache%20Emulation.md)
- [Security Policy emulation (or testing)](./Security%20Policies.md#)

# WS

The WebSockets are to be handled by the [bare client](https://github.com/MercuryWorkshop/bare-mux)

# WebRTC

It was a common misconception for a long time that WebRTC was a significant obstacle for proxies. WebRTC's turn protocol, made for NAT traversal, essentially functions as a proxy. Besides, any schools block WebRTC completely, breaking streaming and conference calls. We can do only two things for this with proxies: emulating this in WS or HTTP. The format is the best option because HTTP's protocol is far from WebRTC's channels. WS's tunnels are similar to data channels in many ways.
