---
title: CI support (GitHub Actions)
---

# [GitHub Actions](https://docs.github.com/en/actions/about-github-actions/understanding-github-actions) that will be created (when these workflows will be run)

There will be actions for the following [events](https://docs.github.com/en/actions/about-github-actions/understanding-github-actions#events):

## When a PR is created or updated:

The workflows that will be executed will comment about code that broke because of changes you made in your commits in your PRs, not before you. The checks to merge will fail if they were not a result of what you committed in your PR (ignore checks that also failed in the last PR), but they will be optional because it was already broken in the commits before yours.

## When a PR is made to be merged from `unstable` -> `main`

Unlike [when a PR is created or updated](#when-a-pr-is-created-or-updated), all checks must pass, even if it is not your fault. This is to ensure that the main branch remains bug-free.

# [Workflows](https://docs.github.com/en/actions/about-github-actions/understanding-github-actions#workflows) that will be supported

## [ ] TODO: aero's own unit tests and systems tests

This will run:
- [ ] TODO: If the SW and AeroSandbox are modified: `npm run testsAll` in the background
- [ ] TODO: If the SW is modified: `npm run testsSW` in the background
- [ ] TODO: If the AeroSandbox is modified: `npm run testsSandbox` in the background
