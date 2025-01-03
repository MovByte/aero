/**
 * All the `for` types here should be `"set"`
 */

export interface SendLoadPing {
	for: "send";
	clientId: string;
	data: {
		loadedFine: true
	}
}