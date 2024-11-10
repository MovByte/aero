---
title: Escaping
description: This doc writes about Request Interception in aero's SW and AeroSandbox
---

Escaping is an interestingly unique concept because it affects many areas of proxy development. Escaping is where you prefix a value so only a particular thing can use it. You must implement API interceptors to remove this added identifier so the site suspects nothing wrong. Escaping is usually done in proxies with the proxy origin and then a character to indicate that the URL is finished, and the rest after that is the original data. This should be a character that can't be listed in a URL [as per RFC 3986](https:/www.rfc-editor.org/rfc/rfc3986#section-2) (`ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~:/?#[]@!$&'()*+,;=`).

# Message escaping

In this use case, the key is the channel, if it exists, or instead, the message data object but with the proxy origin attached to it as a property with the original data as a property in this object. In the case of messages, the message listener can't be invoked at all.

# Storage escaping

This involves escaping the directory names (exclusively in the Filesystem API) or the store names.

# Propery escaping

For example, in WebRTC interception, the iceServers escape because they are modified for internal use. The other alternative would be to make a copy of the RTCPeerConnection class, which would be a lot of overhead.
