type proxyOrigin = true;
self.nestedSWs = new Map<proxyOrigin, NestedSW>();

// TODO: Use this polyfill if needed https://github.com/GoogleChromeLabs/dynamic-import-polyfill

// Config types
type NestedSW = {
	options: RegistrationOptions;
	events: any;
};

// TODO: Move this to aero.d.ts
type NestedSWAPIInterceptors = {
	Function?: typeof Function;
	self?: typeof globalThis;
	addEventListener: typeof self.addEventListener;
	removeEventListener: typeof self.removeEventListener;
	postMessage: typeof self.postMessage;
};

function rewriteSource(sourceCode: string) {
	// TODO: Implement
	// TODO: Wrap everything in a try statement and catch and if there is an error send it to the site that generated the nested SW
	return sourceCode;
}

const createNestedSWFetchSandbox = nestedSWListener => {};
// TODO: Sandbox the Content Index and Cache APIs
const createNestedSWRunnerSandbox = (sourceCode: string, nestedSW) => {
	const proxified: NestedSWAPIInterceptors = {
		addEventListener: new Proxy(self.addEventListener, {
			apply(_target, _that, args) {
				const [type, listener] = args;

				if (type === "fetch")
					nestedSW.events.fetch = realSWEvent => {
						listener(realSWEvent);
					};
				// TODO: Support other the other SW events
			}
		})
	};
	proxified.self = new Proxy(self, {
		get(target, prop) {
			if (prop in proxified) return proxified[prop];
			else return Reflect.get(target, prop);
		}
	});
	proxified.Function = new Proxy(Function, {
		construct(target, that, args) {
			const [_funcArgs, evalCode] = args;

			args[2] = rewriteSource(evalCode);

			const createdFunc = Reflect.construct(target, that, args);
			return createdFunc.bind(proxified.self);
		},
		get(target, prop) {
			if (prop === "bind" || prop === "call" || prop === "apply") {
				target[prop] = new Proxy(target[prop], {
					apply(target, that, args) {
						let [thisArg, ...bindArgs] = args;

						thisArg = {
							...proxified.self,
							...thisArg
						};

						return Reflect.apply(target, that, [
							thisArg,
							...bindArgs
						]);
					}
				});
			}
		}
	});
	return new Function(...Object.keys(proxified), sourceCode)(
		proxified.self,
		proxified.addEventListener,
		proxified.removeEventListener,
		proxified.postMessage
	);
};

export default () => {
	const nestedSWBC = new BroadcastChannel("nestedSW");

	function continueWithSource(data, sourceCode) {
		const nestedSWSandbox = createNestedSWRunnerSandbox(sourceCode);

		try {
			nestedSWSandbox(sourceCode);
			nestedSWBC.postMessage({
				type: "registered",
				data: {
					id: data.id
				}
			});
		} catch (err) {
			nestedSWBC.postMessage({
				type: "registration_failed",
				data: {
					id: data.id
				}
			});
		}
	}

	nestedSWBC.onmessage = ev => {
		if (ev.data.type === "register") {
			if ("swURL" in ev.data) {
				fetch(ev.data.swURL)
					.then(resp => {
						const sourceCode = resp.text();
						continueWithSource(ev.data, sourceCode);
					})
					.catch(err => {
						nestedSWBC.postMessage({
							type: "err_fetch_failed",
							data: {
								url: ev.data.swURL,
								id: ev.data.id,
								error: err
							}
						});
					});
			} else if ("sourceCode" in ev.data) {
				continueWithSource(ev.data, ev.data.sourceCode);
			} else {
				nestedSWBC.postMessage({
					type: "err_invalid_sw_url",
					data: {
						url: ev.data.swURL,
						id: ev.data.id
					}
				});
			}
		}
	};
};
