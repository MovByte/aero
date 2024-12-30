/**
 * @module
 * (us being the current proxy origin)
 */

/**
 * A broadcast channel wrapper for us to get an expected value from the data we give the SW for a certain client for use in aero internally
 * @param toGet THe variable to get
 */
export default function getValFromSW(toGet: {
	name: string
}): void {
	return $aero.extLib.syncify(new Promise((resolve, reject) => {
		const bc = new BroadcastChannel(`$aero-get-stored-val`);
		bc.postMessage({
			clientId: $aero.clientId,
			for: "get",
			...toGet
		})
		bc.onmessage = (event: MessageEvent) => {
			if (event.data.clientId === $aero.clientId && event.data.for === "get" && event.data.name === toGet.name) {
				resolve(event.data.val);
			}
		};
	}));
}