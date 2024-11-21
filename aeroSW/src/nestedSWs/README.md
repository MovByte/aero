# Nested SW support for proxies

[Dev Docs](./DEV.md)

This is a library that you import on the top of your main SW (not in the proxy handler itself) that will intercept the event listeners to allow for new SWs to be evaled and then handled. This library requires that your browser sandboxing library supports it. When building you are recommended to provide directories that contain your proxy files (excluding the bundles for the SW, because they have already been imported). This will block the nested SWs from registering themselves on those directories and maliciously taking over your proxy.
