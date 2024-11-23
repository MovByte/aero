/**
 * A class representing a Cache.
 */
export default class Cache {
	/**
	 * Get the current time in seconds.
	 * @returns The current time in seconds.
	 */
	get getTime(): number {
		return Math.floor(Date.now() / 1000);
	}

	/**
	 * Check if the cache is fresh.
	 * @param age - The age of the cache in seconds.
	 * @returns True if the cache is fresh, false otherwise.
	 */
	isFresh(age: number): boolean {
		return age < this.getTime;
	}
}
