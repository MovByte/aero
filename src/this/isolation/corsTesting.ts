import { ResultAsync, okAsync, errAsync as errrAsync } from "neverthrow";}

/**
 * @module
 * This module is responsible for testing if a request would be blocked due to CORS rules. This is a more interception-focused as an alternative to CORS testing, however it significantly increases request volume (by 2x)
 *
 * @example
 * import block from "...";
 *
 * wait block(proxyUrl.href);
 * if ()
 *  return new Response("Blocked by CORS", { status: 500 });
 */
// Tests to see if the request would be blocked due to cors rules
export default async (proxyUrl: string): Promise<ResultAsync<boolean, Error>> => {
    try {
        const controller = new AbortController();
        const signal = controller.signal;

        await fetch(proxyUrl, {
            mode: "no-cors",
            // Prevent the unnecessary transfer of the response body, if the request was actually fulfilled, which I doubt would happen anyways
            method: "HEAD",
            signal
        });

        // Don't actually send the request
        controller.abort();

        return false;
    } catch (err) {
        return err instanceof Error && err.name === "AbortError";
    }
};
