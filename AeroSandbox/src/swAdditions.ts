/// Here will lie the IPC code, which certain parts of the AeroSandbox Runtime library need for extra features, which requires an API backend. Most of the time, it is inappropriate to use message channel events, because SWs tend to kill themselves after a while, so instead POST requests are useed a lot with SW Additions to get what we want in the data.

// This file just contains the handlers and actually just a master for a lot of other individual handlers. These handlers, which are imported and routed accordingly here end with the file extension `.swAdditions.ts`

// TODO: I will make a library in my proxy middleware implementation repo, which is sort of like middleware, but it is low level and it could help you make a higher-level middleware standard. It will be bundled into `interceptFetch.js`, which you import (with importScripts) into your SW before your proxy imports, and it will automatically proxify the addEventListener and catch into it. You would be able to add middleware to it as well. It will also have a function in the SW global scope (on self) where you have to add middleware `addFetchMiddleware(eventType, eventHandler)`. The event types will be: "onbefore" and "onafter". The eventHandler will be a function that is called with the event as it currently stands in the execution. So yes, this sw Additions file will exist, but it's only purpose would be to call `addFetchMiddleware` for all of the other fetch middleware that the `.swAdditions.ts` default-export, and obviously needs to be below the `interceptFetch.js` import.

/**
 *
 * @param - The fetch event
 * @returns
 */
// biome-ignore lint/suspicious/noConfusingVoidType: void is to pass the to the rest of the SW code
self.fetchEventMiddleware = async (
	event: FetchEvent
): Promise<Response | void> => {};
