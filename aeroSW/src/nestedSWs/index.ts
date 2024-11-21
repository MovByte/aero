// @ts-nocheck

// Originally from handle.ts

// TODO: I HAVE A NEW IDEA IMPORTANT! I WILL WRITE A LIBRARY THAT YOU importScripts INTO ANY SW and you will get nested SWs. This will be a proxy-independent solution. It will proxy addEventListener to do the routing needed and behind the scenes interpret the register data (do the fetching)
// TODO: Listen to messages that will automatically correspond to registering new emulated SWs
const nestedSwHandlers = {
	// scope, src to JS file
	FetchEvent: new Map<string, string>(), // TODO: Perform the routing for all of the other events in this SW
	InstallEvent: new Map<string, string>(),
	ActivateEvent: new Map<string, string>(),
	MessageEvent: new Map<string, string>(),
	SyncEvent: new Map<string, string>(),
	PushEvent: new Map<string, string>(),
};

// Originally from handle.ts

// Nested SW support
// The reason why this isn't done inside of a Bare Mixin is due to performance concerns. If it were to be a Bare Mixin, unlike proxy middleware, the logic in between below and the Bare Client would still have to be run, despite not being necessary
if (flags.workers)
	for (const [scope, src] of nestedSwHandlers.FetchEvent) {
		try {
			const handler = await(await bare.fetch(src)).text();
			try {
				if (
					location.pathname.startsWith(
						new URL(location.origin, scope).pathname
					)
				) {
					// TODO: This is just for show. I would actually must get inside of the brackets, ignoring the function header
					// TODO: Type this thing correctly
					const swHandler = new Function(handler(event));
					return swHandler();
				}
			} catch (err) {
				if (err instanceof TypeError)
					throw new Error(
						`Invalid scope for a nested sw fetch event handler:\nscope: ${scope}\nhandler: ${handler.toString()}. Check to ensure the safeguards for invalid URLs in the interception of navigator.serviceworker.register are effective enough to prevent this outcome.`
					);
			}
		} catch (err) {
			if (debug && err.exception.name === "NetworkError")
				// TODO: Send back an error code which indicates that the fetching the SW failed, and on the client process it to throw the emulated error (What you would. normally see, if there was a network request while registering a SW. SW registration failed with error ...)
				null;
			else {
				throw err;
			}
		}
	}
