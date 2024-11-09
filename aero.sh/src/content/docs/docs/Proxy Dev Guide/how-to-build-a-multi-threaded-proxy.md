---
title: How to build a tri-threaded SW proxy
description: A guide to building a tri-threaded SW proxy intended for new proxy devs
---

# By using a Service Worker, you already have a bi-threaded proxy

The JS runs off the main thread whenever you create a new Worker. This leads to performance benefits. If you remember from earlier, one of the reasons why we use Service Workers, other than more catch-all (easier) interception, is because it offloads the rewriting of the network requests to a separate thread.

# bare-mux 2.0

I've already explained why you should use bare-mux. One of the most commonly used things in proxy is the client used to send requests to be proxied. In a SW proxy, the Service Worker uses it when it intercepts the fetch event, and your client-side JS injects probably use it to proxy the WS because the fetch event doesn't have events for WS. If you use bare-mux 2.0, you can initialize the same client in both the SW and the client-side JS injects, and as a result, it would do the proxying magic in another thread. Before version 2.0, bare-mux never ran in a SharedWorker, so you should update it if you are on old versions.

# Closing words

If you do all the optimizations described above, you can have your proxy run in three threads, which would be very epyc (pun intended). It is important to note that there is a limit to how many Workers you can create. For example, Firefox only allows twenty Web Workers per domain.
