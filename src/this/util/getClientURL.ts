/**
 * @module
 * This module contains functions to get the URL of the client through various means
 */

// Neverthrow
import type { ResultAsync } from "neverthrow";
import { okAsync, errAsync as errrAsync } from "neverthrow";

// Utility
import { afterPrefix } from "$sharedUtil/getProxyUrl";
import appendSearchParam from "$sharedUtil/appendSearchParam";

/**
 * Gets the URL of the client through the `Client` API in SWs
 * This client URL is used when forming the proxy URL and in various uses for emulation
 * @returns The `URL` of the client wrapped in a `ResultAsync` for better error handling from *Neverthrow*
 */
export default async function getClientUrlThroughClient(clientId: string): Promise<ResultAsync<URL, Error>> {
	/** The client that contains information for the current window */
	const client = await clients.get(clientId);
	if (client)
		// Get the url after the prefix
		return okAsync(new URL(afterPrefix(client.url)));
	return errrAsync(new Error("Failed to get the window client required to get the client URL"));
}

/**
 * Gets the URL of the client through forcing the referrer policy and parsing that referrer URL
 * This client URL is used when forming the proxy URL and in various uses for emulation
 * @returns The `URL` of the client wrapped in a `ResultAsync` for better error handling from *Neverthrow*
 */
export async function getClientUrlThroughForcedReferrer(pass: {
	params: string,
	referrerPolicyKey: string,
	referrerPolicy: string,
}): Promise<ResultAsync<URL, Error>> {
	// Referrer policy emulation (we will force the referrer later)
	appendSearchParam(
		params,
		referrerPolicyKey,
		referrerPolicy
	);
	// TODO: Implement
	return errrAsync(new Error("Not implemented yet"));
}