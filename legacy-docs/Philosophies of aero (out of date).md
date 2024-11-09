# Philosophies of aero

## The No-parse Philosophy

Aero only parses if it has to. Typically, aero intercepts APIs rather than rewriting them. Rewriters require parsers. Parsing to rewrite is an instance of double parsing. The only exception is using DOMParser and injecting the rewrote HTML because the DOM tree is already formed before it is injected. The only cases you must parse in proxies are Cache Manfiests and Web App Manifests. Even in these cases, aero uses the parsers built into the browsers, except Cache Manifests. Cache Manifests are deprecated and only function in older browsers or Safari anyway. No APIs let you modify the manifest's content for good reasons. It has to be parsed and modified on the SW itself.

## The Future-proofing Philosophy

It's a chore to keep up with the latest standards and proposals. I will process the standard docs in compile-time to get up-to-date information about APIs whenever possible. I want to ensure that aero never gains vectors for detection in the future.

## Wide-support

Aero strives to have its proxy usable wherever possible for browsers in the last 15 years. This includes supporting deprecated APIs and providing polyfills like those in \[Forward Compat](TODO: Link to it).
