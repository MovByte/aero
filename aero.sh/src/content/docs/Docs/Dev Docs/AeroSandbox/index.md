---
title: Index
description: A collection of dev docs related to AeroSandbox
---

# Glossary

- **Revealers**: These are the APIs or browser features that need to be concealed
- **[Shim](<https://en.wikipedia.org/wiki/Shim_(computing)>)**
- **[Polyfill](<https://en.wikipedia.org/wiki/Polyfill_(programming)>)**
- Backwards-polyfill:This refers to a polyfill whose purpose is to provide legacy APIs to modern browsers
- [... API interceptor-related terms](interceptors/index.md#glossary)
- **internally used APIs** vs **externally used libraries**: *internally used APIs* are APIs that are used by aero/AeroSandbox and externally used libraries are APIs that can be found helpful for other devs, but not used in the codebase

> This section assumes that you have already read the [Glossary for aero](../../../index.md)

# Directory listing

- `src/`
 :`API/`: This folder contains the code for the methods on the AeroSandbox. This is not the place if you are looking for the API interceptors.
 :`cors/`; The code for cors emulation
 :`interceptors/`: The code for aero's API interception. For the subfolders [see](interceptors/index.md#directory-listing).
 :`sandboxers/`: This contains the interceptors that intercept the actual code. They are synonymous with the "rewriter" code that you may see in non-interception proxies. They are faster and lighter than rewriters.
 :`shared/`: This is code used in multiple other directories

# Scopers

TODO: Link and document the the scopers

# Projects that make use of AeroSandbox

# Projects I plan on working that would use AeroSandbox
