---
title: Getting used to the web standards
description: This document is for acclimating new proxy devs to the web standards relevant to proxy dev
---

# Proxy-related standards

## TompHTTP

TODO: Write...

## Wisp

TODO: Write...

# Web standards

> [MDN](https://mdn.dev) is a great starting point. They aggregate these standards into easy-to-digest articles for beginners. They are great for getting the gist of things.

## Standard organizations

- [W3C](https://www.w3.org/) - Anything that is not covered by the standard organizations below is found there
- [ECMAScript](https://ecma-international.org/publications-and-standards/standards/ecma-262) - Anything that has to do with the JS _language_ itself is found there. , ECMAScript doesn't specify browser APIs, and you should refer to W3C standards for them.
- [WhatWG](https://whatwg.org/) - A consortium of big tech companies that dictate how HTML 5 evolves. Note that the W3C still specifies older XML-based markup languages and CSS.
- [IETF RFCs](https://www.ietf.org/standards/rfcs/) - This is where you can find the documentation on specific web protocols

> In aero, anything that is in draft stages has to be enabled under the "experimental" flag, and anything that is deprecated has to be enabled under the "legacy" flag.

# Typings

> This section only applies to proxies that use [TS](https://www.typescriptlang.org), which I do recommend. Proxies can easily get complex over time, and debugging them is difficult.

Sometimes, the most up-to-date standards still need inclusion in lib.dom.ts, where the APIs on the window are usually defined. You could extend the window interface like this:

````ts
declare global {
  interface Window {
    ```New API```: any;
  }
}
````

It's not safe to implicitly declare a property as any. Instead, it would help if you were using the WebIDL interfaces provided in the standard documents themselves. I recommend using [webidl2ts](https://github.com/giniedp/webidl2ts) for this purpose. This library is handy for supporting standards that are in the draft stages. This is what I use in aero, and I have a script that is ran before aero is built to run `webidl2ts` to generate the needdd typings.

# [Origin Trials](https://developer.chrome.com/origintrials/#/trials/active) Resources

- [Explainer](https://github.com/GoogleChrome/OriginTrials/blob/gh-pages/explainer.md)
- [Explainer FAQ](http://googlechrome.github.io/OriginTrials/developer-guide.html)
- [Data Science](https://rviscomi.dev/2023/07/origin-trials-and-tribulations)

Although the APIs are not available on all sites, It's essential to support them because they are simply in an Origin Trial, which shows that Browser developers will probably implement them soon.

## Links to the Origin Trials for every browser

- [Chrome](https://developer.chrome.com/origintrials/#/trials/active)
- [Edge](https://microsoftedge.github.io/MSEdgeExplainers/origin-trials)
- [Mozilla](https://wiki.mozilla.org/Origin_Trials)
