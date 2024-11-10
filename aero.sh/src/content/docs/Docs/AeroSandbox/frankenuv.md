---
title: FrankenUV
---

Inject this on the client side. JS injects after the UV bundle, and you get the API compatibility of aero in the UV base (imports not shown). It supplements the APIs that aren't supported in UV with the ones from aero.
I will publish the built bundles in AeroSandbox so that proxy site devs only have to put one script into the UV. I want to get aero builds on GitHub Releases, but you have to build it yourself for now.

No one should put the effort into manually adding a new API interception into UV. We have our proxies to work on. AeroSandbox isn't made for rewriting content URLs because it uses interception, so it wouldn't be viable to replace UV's rewriters. However, I could make a fork of UV that includes content URL interception and has FrakenUV with my rewriters on it. It would also have to disable many UV API interceptors and replace them with aero ones, so what is the point?

> This will become a proper UV fork, since it needs to disable UV's rewriters to include AeroSandbox's. I will still publish bundles that don't need the forked version of UV and instead you just include the supplemental "bundle" and it just works.