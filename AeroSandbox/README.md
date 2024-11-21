# AeroSandbox library

This is a proxy-independent library that lets you modify... It will work even without SW capabilities. This is where all the non-sw code of aero lays.

> This document is out of date planned to be removed, and some parts may be incorporated into other documents

## It will let you

- [ ] [Freezing or faking element states](./docs/Faker%20API.md). The Faker API will trick the DOM APIs into thinking that the element still exists or has properties different from what it has. Still, in reality, only a copy of it has been removed or modified from the DOM and cloned to the shadow DOM. You can also put dummy elements. This allows Adblock to be completely undetectable. It also allows panels to be injected without allowing the site to detect their use. It will also serve as the base of my middleware html ui.
  - [ ] Adding to the use case, you will be able to [intercept HTTP requests without a Service Worker](src/API/SW-less/README.md) and get back mock responses, making the browser think there is no asset blocking. Soon, you can bring back your MW2 extensions from your dead using injected scripts combined with this library. I will provide polyfills for these removed APIs, which you can import into your extension.
- [ ] Intercept redirects so that you can provide logging or link checking. A real-world example is that many social media sites change their href to be a link checker that processes the URL before finally redirecting. They usually do this to warn the user that they are leaving the site (to mitigate phishing attempts) or check the link on something like VirusTotal. When you click the links, Google Search does something similar: you are first redirected to an endpoint for analytics purposes.
- [ ] Speed up your proxy by not parsing, turning it into an interception proxy rather than a semi-interception proxy. You will be able to [patch other proxies to take advantage of the sandboxed's capabilities](#shims-for-alternative-proxies)
- [ ] AeroSandbox would be helpful if your client-side injects are broken, but you still want to test your SW and make sure it works properly

> TODO: Fix the MD links here

## Maintainability / Futureproofing

This library directly parses concealer standards, so you can ensure that most API interceptors will keep up with the latest specifications. Unless there is a significant enough change regarding how requests are made, it will parse the documentation and the WebIDL files.

## Projects that make use of this library

TODO: ...
