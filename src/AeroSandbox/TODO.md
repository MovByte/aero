# TODOs

- [ ] Publish AeroSandbox to NPM. There will be specific builds for specific features for tree-shaking purposes. I'm trying to make AeroSandbox a seperate library for stability, portability, and a lower bundle size.

- [ ] In html.ts, instead of keeping an attribute to mark the element, store them in a WeakMap, so they can automatically be cleaned up by the garbage man
- [ ] Move all of the middleware code into a modified BareClient
- [ ] Seperate the package.json for middleware. Then, cleanup the package.json.
- [ ] Provide auto-builds
- [ ] Implement url encoding
- [ ] Fix HTTP and STS Emulation
- [ ] Aero sandboxing library
- [ ] Support nested SWs
- [ ] Finish aero message proxying
- [ ] Migrate the HTML Rewrites to the the rewriting rules
- [ ] URL Encoding / Hash support
- [ ] Use storageIsolator internally in AeroSandbox Runtime and call that instead of the API intercpetors directly

## Docs

## HTML Rewriting

- [ ] Support XML/XSLT documents

## API Support

- [ ] Support proxifying MutationEvents (deprecated), before they are removed from Chrome soon - <https://w3c.github.io/uievents/#interface-mutationevent>
- [ ] Support the FLoC APIs
- [ ] The FetchLater API
- [ ] TODO: Add more draft/experimental/origin trial APIs to the list
- [ ] https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API#basic_access_control
