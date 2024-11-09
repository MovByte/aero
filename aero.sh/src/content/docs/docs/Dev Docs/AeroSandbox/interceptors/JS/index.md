---
title: Index
description: A collection of dev docs related to JS rewriting
---

TODO: This is a stub...

# AeroJet

TODO: Describe...

# AeroGel

Aero uses minimal parsing and more interception than full-parse methods such as EST rewriting. AeroGel uses the tiniest RegExp parsing, and it is efficient. It wraps the objects you want to overwrite, but the browser doesn't allow you to overwrite in an IIFE. However, this brings the problem of let/const being block-scoped to the IIFE.

AeroGel solves this by using setters on "fake vars' for let/const through minimal RegExp rewriting so that it can trap the variable calls, put them on the window so they are globally scoped, and then inside of the Window Proxy, which is one of the proxies passed into the IIFE, trap them in calls so that those variables aren't seen on the window as a property, but emulated as a scope.

# How fake vars work

> Keep in mind this rewriting is only done during the first block scope once you enter a function no nested functions, for example

AeroGel transforms as such:

> These examples are for let, but the same applies for const

## Array Destructuring

```ts
let [var1, var2] = ...;
```

->

```ts
<fakeVar>.fakeArrayDestructure = ([var1, var2], ...);
```

## Object Destructuring

```ts
let { var1, var2 } = ...;
```

->

```ts
<fakeVar>.fakeObjectDestructure =
 ([var1, var2], ...);
```

## Normal variables

```ts
let x = ...;
```

->

```ts
let.x = ...;
```
