---
title: Wombat Shim (proposal)
---

TODO: Link to this in the list of proposals

This will be a shim for the Wombat API in AeroSandbox so that you can swap out [Wombat](https://github.com/webrecorder/wombat) for AeroSandbox in [pywb](https://github.com/webrecorder/pywb) and [Womginx](https://github.com/binary-person/womginx).

It will work by making Proxy Objects and Objects with property traps that either overwrite AeroSandbox functionality with `SpecialInterceptionFeaturesEnum.requestUrlProxifier` enabled in the AeroConfig bundle or for the config, it will instead overwrite aero's config in the background.

Specifically, setting properties on wbinfo would "proxy AeroSandbox's config."

Here are examples of wbinfo:

- [wbinfo and $wbwindow as passed into the constructor](https://github.com/webrecorder/wombat/blob/26a39e4b5d6bc1d3ef391c8ec3d710d92de5b6fd/src/wombat.js#L16-L19)
- [wbinfo used in Womginx](https://github.com/binary-person/womginx/blob/d11aecdb1f04f778c6fd769f5972101d95b2b73a/public/wombat-handler.js#L28-L45)

This shim will also proxy AeroSandbox's own rewriter APIs `AeroSandbox.rewriters.*` to the rewriter APIs on Womginx `window._wb_wombat.*` ($wbwindow) while still keeping the same API that Womginx originally had.
