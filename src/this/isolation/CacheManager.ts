import { ResultAsync, okAsync, errAsync as errrAsync, Result, ok, err as errr } from "neverthrow";

import Cache from "./Cache";

export default class extends Cache {
    mode: RequestCache;

    /**
     * Constructs a CacheManager instance based on request headers.
     *
     * @param headers - Request headers used to determine cache mode.
     */
    constructor(headers: Headers) {
        super();

        // https://fetch.spec.whatwg.org/#concept-request-cache-mode
        this.mode = this.determineCacheMode(headers);
    }

    /**
     * Determines the appropriate cache mode based on request headers.
     *
     * @param headers - Request headers.
     * @returns The determined cache mode.
     */
    private determineCacheMode(headers: Headers): RequestCache {
        // Check for conditional request headers
        if (
            this.#hasConditionalRequestHeaders(headers) &&
            this.mode === "default"
        ) {
            return "no-store";
        }

        // Check for explicit cache mode header
        const passCacheMode = headers.get("x-aero-cache");
        if (this.#isValidCacheMode(passCacheMode)) {
            // @ts-ignore
            return passCacheMode;
        }

        // Default to "default" mode
        return "default";
    }

    /**
     * Determines if request headers contain conditional request headers.
     *
     * @param headers - Request headers.
     * @returns True if conditional request headers are present, false otherwise.
     */
    #hasConditionalRequestHeaders(headers: Headers): boolean {
        // List of conditional request headers
        const conditionalHeaders = [
            "If-Modified-Since",
            "If-None-Match",
            "If-Unmodified-Since",
            "If-Match",
            "If-Range"
        ];

        return conditionalHeaders.some(header => headers.has(header));
    }

    /**
     * Determines if a given string is a valid cache mode.
     *
     * @param cacheMode - The potential cache mode string.
     * @returns True if the cache mode is valid, false otherwise.
     */
    #isValidCacheMode(cacheMode: string): boolean {
        const validCacheModes = [
            "default",
            "force-cache",
            "no-cache",
            "no-store",
            "only-if-cached",
            "reload"
        ];
        return validCacheModes.includes(cacheMode);
    }

    /**
     * @param - Proxy origin
     */
    async clear(origin: string): Promise<void> {
        const cache = await this.#getCache();
        const keys = await cache.keys();

        for (const req of keys) {
            if (req.url.startsWith(origin)) {
                // TODO: Log this event if in verbose or debug mode
                cache.delete(req);
            }
        }
    }

    /**
     * @param - Cache Control HTTP Header
     * @param - Expire HTTP Header for fallback
     * @returns
     */
    async getAge(
        cacheControl: string,
        expiry: string
    ): Promise<ResultAsync<number | false, Error>> {
        if (cacheControl) {
            let secs: number;
            try {
                const dirs = cacheControl.split(";").map(dir => dir.trim());

                secs = Number.parseInt(
                    dirs
                        .find(dir => dir.startsWith("max-age"))
                        // FIXME: Breaks on https://dailymail.com
                        .split("=")
                        .pop()
                );
            } catch (err) {
                return errrAsync(
                    new Error(
                        `Failed to parse cache control header for the max age${ERROR_LOG_AFTER_COLON}${err.message}`
                    )
                );
            }
            return okAsync(secs ? secs + this.getTime : false);
        } return this.#parseAge(expiry);

        return false;
    }

    /**
     * @param - Proxy path
     * @param - Cache age
     * @returns Cached resp
     */
    async get(path, age): Promise<Response | false> {
        const cache = await this.#getCache();

        if (
            // Bypass caches
            this.mode !== "no-store" &&
            this.mode !== "reload" &&
            this.mode !== "no-cache" &&
            // Ignore freshness
            (this.mode === "force-cache" ||
                this.mode === "only-if-cached" ||
                // Check the freshness
                this.isFresh(age))
        ) {
            const resp = cache.match(path);

            return resp instanceof Response ? resp : false;
        }

        return false;
    }

    /**
     * @param - Proxy path
     * @param - Proxy resp
     * @param - Vary header
     */
    async set(path: string, resp: Response, vary: string): Promise<ResultAsync<void, Error>> {
        const cache = await this.#getCache();

        if (
            this.mode !== "no-store" &&
            this.mode !== "only-if-cached" &&
            vary === "*"
        ) {
            try {
                await cache.put(path, resp);
            } catch (err) {
                const action = "to put the response into the cache";
                return errrAsync(new Error(err instanceof TypeError ? `The URL for the path ${action} is invalid: ${err.message}` : `Uncaught error while trying ${action}${ERROR_LOG_AFTER_COLON}${err.message}`));
            }
        } else {
            // TODO: If in verbose/debug mode, log that nothing was put into the cache
        }
        return ok(undefined);
    }

    async #getCache(): Promise<Cache> {
        return await caches.open(self.config.cacheKey);
    }

    // Convert expiry date to seconds
    /**
     * @param - The Expire HTTP Header to convert
     * @returns - The number of seconds until the expiry date
     */
    #parseAge(expiry: string): Result<number> {
        let date: number;
        try {
            date = Date.parse(expiry)
        } catch (err) {
            return errr(new Error(`Failed to parse the date for the expiry HTTP header${ERROR_LOG_AFTER_COLON}${err.message}`));
        }
        return (date / 1000) | 0;
    }

    get bypass(): boolean {
        return this.mode === "no-store" || this.mode === "reload";
    }
}
