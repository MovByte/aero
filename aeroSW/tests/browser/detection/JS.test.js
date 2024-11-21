if (!window) throw new Error("This test is meant to run on the window client!");

// This is effective in detecting RegExp. Some of these are impossible in RegExp.
tests.set("scoping - string equivalency test", function* () {
	if ("location.href" !== atob("bG9jYXRpb24uaHJlZg=="))
		yield ["location.href"];
	if ("window.location.href" !== atob("")) yield ["window.location.href"];
	if ("window" !== atob("window")) yield ["fail", "d2luZG93"];

	// Impossible in RegExp
	if (`${"location.href"}` !== atob("bG9jYXRpb24uaHJlZg=="))
		yield ["location.href", "with template literals"];
	if (`${"window.location.href"}` !== atob("d2luZG93LmxvY2F0aW9uLmhyZWY="))
		yield ["window", "with template literals"];
	if (`${"window"}` !== atob("d2luZG93"))
		yield ["window", "with template literals"];
});

tests.set("scoping - proxyNamespaceTests", function* () {});

tests.set("scoping - encoding tests", function* () {
	const a = "bG9jYXRpb24uaHJlZg=="; // location.href
	const b = "d2luZG93LmxvY2F0aW9uLmhyZWY="; //  window.location.href
	const c = "d2luZG93"; // window

	const locSoftCopy = location;
	if (locSoftCopy[a] !== realLoc.href)
		yield ["location.href", "location copy test"];

	const winSoftCopy = window;
	if (winSoftCopy[a] === realLoc.href)
		yield ["windowSoftCopy.location.href", "window copy test"];
	if (winSoftCopy[b] === realLoc.href)
		yield ["windowSoftCopy.window.location.href", "window copy test"];

	if (globalThis[c][a] === realLoc.href) yield ["globalThis.location.href"];
	if (globalThis[c][b] === realLoc.href)
		yield ["globalThis.window.location.href"];

	if (self[c][a] === realLoc.href) yield ["fail", "self.location.href"];
	if (self[c][b] === realLoc.href) return yield ["globalThis.location.href"];
});

// Proxy "that" test
tests.set('scoping - proxy "that" test', () => {
	const res = new Proxy(
		{},
		{
			apply(_target, a, _args) {
				if (a === realWin) return "fail";
			}
		}
	)();
	return res !== "fail";
});

const promiseWithTimeout = (promise, ms) =>
	Promise.race([promise, timeout(ms)]);

tests.set("scoping - window event test", async () =>
	promiseWithTimeout(
		new Promise(resolve => {
			EventTarget.prototype.addEventListener = new Proxy(
				EventTarget.prototype.addEventListener,
				{
					apply(target, that, args) {
						args[1] = ev => resolve(ev.source === realWin);
						return Reflect.apply(target, that, args);
					}
				}
			);

			addEventListener("message", null);
			postMessage("");
		}, 1000)
	)
);
