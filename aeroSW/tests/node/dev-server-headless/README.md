# Dev Server headless tests (plan)

This test will check if aero's SW runs, Bare-Mux works fine (with no broken API interceptors, which AeroSandbox will soon log if that is the case), and finally check if the site loaded fine.

## Initialization

1. When the headless tests are first ran it will spin up the aero dev server
2. Run the base tests: For each test, it will load up the site accordingly and look to make sure the site content (DOM) is how it should be, ensure the expected globals are defined properly, check to see if no errors are logged in the console, check to see the expected requests have loaded fine, and test to see if the built-in bundles have loaded as expected.

## CI

There will be a Github Actions CI for every PR request created, which will run these checks. For more information, read [this doc](../../../docs/Plans/CI%20support.md).

## Specific site check details

The subheadings here contain details for how the [Playwright]()-based tests will be implemented (instructions for how the site will work). All of these will have the base tests.

### `https://example.com` 

1. The site content body will be checked to see if it is identical to what is recorded (this site never changes anyways)

### `https://discord.com`

1. The site content body will be partially checked

#### `https://discord.com/app`

This will check to ensure that the Discord runtime bundles are loaded (the methods defined by the bundles work and the log messages indicate successful loading). TODO: Additionally there will be a config.js in this directory, which will allow you to put in your Discord token and test to see if it works when logged-in. I do not recommend this.