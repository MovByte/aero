const swless: ServiceWorkerContainer = {};

if (/*flags.workers*/ true) {
	// This will not need to use the original function, because all functionality is emulated here. This means that a Proxy object shouldn't be used here.
	// TODO: In the second param: Get the options type from the internal type system used
	swless.register = async (scriptUrl: string, options?: any): void => {
		const resp: Response = $aero.bc.fetch(scriptUrl);

		const text = await resp.text();

		// TODO: Return an emulated error
	};
}
