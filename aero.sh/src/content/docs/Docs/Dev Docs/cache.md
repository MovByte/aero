---
title: Cache Emulation
description: This doc writes about Cache Emulation in aero's SW
---

# Cache Emulation

HTTP caches are emulated by a system using aero's SW's cache stores. This allows caches to be stored for a specific origin rather than apply to the whole site with the actual header. Another reason why this is needed is because the `Clear-Site-Data` header deletes every origin's cache, making aero otherwise detectable.

TODO: Document how it works

# Cache Manifest Rewriting
Aero rewrites the paths in the Cache Manifests files using the [src rewriter](../../../../../AeroSandbox/src/shared/src.ts)

> This web feature is deprecated but is still supported in Safari.
