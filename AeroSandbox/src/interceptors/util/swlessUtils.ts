// These are just concepts ignore this file entirely

/*
// This is what is already set in handleFetchEvent (whatever needs to be passed into handleFetchEvent)
interface FakeEventPartial {
    request: Request;
}

function genFakeClientId(loc?: string) {
    // TODO: Implement...
    throw new Error("stub");
}

function handleFetchEvent(
    partialFakeEvent: FakeEventPartial,
    reqDest = ""
): Response | false {
    let nonDefaultResp: Response | false = false;

    // @ts-ignore
    partialFakeEvent.destination = reqDest;

    let isReload = false;

    if ("navigation" in window) {
        const latestEntry =
            window.performance.getEntriesByType("navigation")[0];
        if (latestEntry) {
            if ("type" in latestEntry)
                isReload = latestEntry.type === "redirect";
        }
    }

    // @ts-ignore
    const fakeEvent: FetchEvent = {
        ...partialFakeEvent,
        handled: async () => true, // TODO: I don't know how to implement this
        isReload,
        clientId: genFakeClientId(location.href),
        replacesClientId: () =>
            document.referrer ? genFakeClientId(document.referrer) : "",
        resultingClientId: () =>
            document.referrer !== document.referrer
                ? genFakeClientId(document.referrer)
                : "",
        // preloadResponse is processed in handleFetchInHTML only
        respondWith: async func => {
            nonDefaultResp = func(...arguments);
        }
    };

    const possibleResp = $aero.sandbox.swless.fetchhandler(fakeEvent);
    if (possibleResp) nonDefaultResp = possibleResp;

    return nonDefaultResp;
}

// This will basically extend the handleFetchEvent class, but with the request destination provide
// tagname, request destination
const fetchInHTMLMap = new Map<string, string>();
// This abstracts a bit
function handleHTML(el: Element) {
    if (el.preload) {
    }
}

export { handleFetchEvent, handleHTML };
*/