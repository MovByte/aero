# WPT-diff tests

What is the point of making your own test cases for every Web API interceptor that your proxy uses. The entire point of a unit test is to feed sample data into a method (in our case WebAPIs). You can write them for each of the APIs that you support, but then you have to factor in if the Web API is supported in the web browser that you are trying to write the tests for. The best thing you can do is run the WPT tests in a headless browser and serialize the all of the passes into a varaible and then do the same thing, but instead of routing the browser to the real location of the web test, put the URL under your web proxy. All you have to do now is get all of the tests passed without a proxy, but not passed under the proxy. This will tell you exactly which APIs don't work under your proxy.

I recommend sorting the APIs that don't work by APIs that don't work because of a flawed API interceptor and those that are broken probably because the proxy doesn't support that API. Specifically, when I make my implementation I will use all of the APIInterceptor exports to collect all of the property paths after the global object (the name of the object on which the API is defined), which would be a list of all APIs that are supported in aero. I will use this list to distinguish between both types.

## How to run WPT (in general not these tests)

`git clone https://github.com/web-platform-tests/wpt.git`
`./wpt run ...`

## Note about CI integration

I will not include a CI integration for the wpt-diff tests because they will likely take hours. I might consider having it done periodically, like every Month on the stable branch, but it takes too much time and resources to run a CI integration for wpt-diff tests.
