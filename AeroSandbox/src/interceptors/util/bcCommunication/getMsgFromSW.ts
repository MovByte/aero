/**
 * @module
 * (us being the current proxy origin)
 */

/**
 * A broadcast channel wrapper for us to get messages from the SW for a certain client for use in aero internally
 * @param chanName The name of the channel to broadcast to (without the $aero prefixing)
 * @param listener The listener to handle the message (as if there was no other client)
 */
export default function getMsgFromSW(chanName: string, listener: (event: MessageEvent) => any): void {
	// @ts-ignore
	new BroadcastChannel(`$aero-${chanName}`).onmessage = (event: MessageEvent) => {
		// Ensure that it was meant for us (the SW controls multiple clients)
		if (event.data.clientId === $aero.clientId)
			listener(event);
	};
}