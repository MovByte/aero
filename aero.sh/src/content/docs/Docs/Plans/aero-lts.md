---
title: aero LTS plan
description: This doc details my plan for the upcoming aero LTS update
---

aero LTS will be released on December 25th, bringing testing for every aspect of aero, including unit testing everywhere possible, integration testing everywhere possible (NPM packages function properly), and the release builds themselves with a headless browser for site support (systems testing). I am also working on a status page, which will list common popular sites and if they are currently as of the latest NPM build work on aero. It will work by a webhook; whenever a new NPM package is published, it will download it and test out aero on those sites. It will ensure the bundles on the sites load fine and the functionality is there. It will use Playwright, which brings unit tests in headless browsers. Additionally, on aero LTS, there will be no bugs and there will never be an aero version pushed with bugs again. That is a promise.