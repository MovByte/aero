# Node package tests for aero

These tests ensure that path exports do not break in the Node package for Aero and AeroSandbox. These tests should always be run after modifying the path code and before publishing the new `aero-proxy`/`aero-sandbox` package version to NPM. Run this is recommended, but optional, regardless, if you modify the path code because it also checks that all of the expected bundles are there.

To test run:

```sh
npm run prep
npm i
npm run
```

> Always run `npm run prep` after you make changes to aero if you want to test

in your terminal