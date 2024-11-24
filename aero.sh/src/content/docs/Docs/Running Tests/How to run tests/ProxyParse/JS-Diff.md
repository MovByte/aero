# How to run *JS-Diff* tests

## How to run it in the context of AeroSandbox

> These will automatically run in every commit to `main` (stable) and `unstable`

### Method 1: Selective test

`cd AeroSandbox && npm run tests:js-diff`

### Method 2: Master tests

This would run all tests including JS-Diff

`cd AeroSandbox && npm run tests:all`

### Method 3: Manually through the CLI

`npx run aero-sandbox/tests/js_diff`

## How to set it up in your own proxy

### Method 1: Setup a GitHub Workflow using the provided Action from aero:

```yml
name: JS-Diff

...

jobs:
  js-diff:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v2

      - name: Run JS-Diff Action
        uses: vortexdl/aero/actions/js_diff
        with:
          ...
```

### Run the CLI

`npx run aero-sandbox/tests/js_diff`

#### Args for the CLI

  - TODO: Write...