---
title: Payment Handler API (proposal)
description: A document describing how to theoretically implement
---

I usually wouldn't speak on this, but supporting Payment Handlers is a complex task, and you could do it in many ways. For one, the Payment Handler API uniquely uses Service Workers. TODO: Elaborate (finish this paragraph)...

For testing purposes, here is a [demo of Payment Handlers](https://googlechrome.github.io/samples/paymentrequest/payment-handler).

# What you must know

## The methods

## Through Emulation

Payment Handler **Emulation** requires SW emulation or Nested SW support with custom polyfilled APIs. A Payment Handler creates a new browsing context with an SW mandated to facilitate payment events. This is a unique use case that the standard SW API does not support. Be careful; these SWs don't have the same handlers as normal ones. They are made for different purposes. The best option would be to fetch the source of the Payment Handler site, create a custom iframe for it, put in the source of that site, and inject your sandboxing library through a srcdoc. Make a config option on your sandboxing class to treat the SWs as Payment Handler SWs.

## Through Enhanced Network Proxying

This partially isn't recommended because it requires an HTTP server backend proxy, and there is currently nothing like epoxy for HTTP. It's a recipe for disaster to use Payment Handlers without E2EE.
