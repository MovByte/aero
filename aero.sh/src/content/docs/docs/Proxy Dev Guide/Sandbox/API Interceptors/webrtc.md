---
title: How to proxy WebRTC
---

I decided to break my rule about not talking about API interceptors because I see many things that need clarification. WebRTC, by design, has its own "proxy" built in. It was designed as a fallback if it couldn't bypass the NAT. It is called TURN, which stands for Traversal Using Relays around NAT. Often, the firewall will block WebRTC, or it can't find a viable path to connect to your peer. You can interchange any WebRTC server.

The way to "proxy" WebRTC is to force a TURN server that you know is unblocked. Hosting a TURN server is difficult and expensive, so I recommend using Google's free one or OpenTURN if you have an API key. Make the TURN servers configurable through the config and force the TURN server when proxifying the WebRTC APIs. It would be best to conceal many events so the site doesn't know that you modified the config to add TURN servers. Forcing TURN is also a good idea because it helps prevent your users from getting their IP leaked when they use your web proxy.

There are countless different WebRTC APIs and protocols after connecting to STUN, the normal peer-to-peer NAT traversal, to the point where it is realistic to make a proxy for each of them if you do it manually.

> Fun fact: Golang is the only language that has libraries for every WebRTC API
