---
title: Why you can't modify the prototype chain
description: An explanation for why you can't modify the prototype chain intended for new proxy devs
---

A lot of times you may notice that many of the predefined JS APIs inehrit from the prototype chain. For example, the `Array` object inherits from the `Object` object. You can't modify Object.prototype to add a new method to all objects, because the instances have already been defined before you overwrote the prototypes. Due to this fundemental nature of the instances already being created, you can't do something like try proxifying `EventTarget.prototype` to intercept every event listener. Likewise, for Error concealing, you can't modify the prototype chain of the Error object to hide the revealing aspects of the stack trace, because the instances have already been created.
