import type { APIInterceptor } from "$types/apiInterceptors.d.ts";
import { proxyLocation } from "$aero/src/shared/proxyLocation";

/**
 * Checks if a segment is a valid directory name.
 *
 * @param {string} segment - The segment to check.
 * @returns {boolean} Whether the segment is a valid directory name.
 */
function isValidDirectoryName(segment: string): boolean {
	return segment.match(/^[a-zA-Z0-9\-_]+$/) !== null;
}

/**
 * Removes one level from the given path.
 * This function splits the path into segments, iterates over them in reverse order, and removes the first ".." segment it encounters that is followed by a segment that is not a valid directory name.
 *
 * @param - The path to modify.
 * @returns The modified path.
 *
 * @example let path = "../../dir1/dir2;
 * let modifiedPath = removeOneLevel(path);
 * console.log(modifiedPath); // Outputs: "../dir1/dir2"
 */
function removeOneLevel(path: string): string {
	// Split the path into segments
	const segments = path.split("/");

	// Iterate over the segments in reverse order
	for (let i = segments.length - 1; i >= 0; i--) {
		// If the segment is ".." and the next segment is not a valid directory name
		if (
			segments[i] === ".." &&
			i < segments.length - 1 &&
			!isValidDirectoryName(segments[i + 1])
		) {
			// Remove this segment
			segments.splice(i, 1);
			break;
		}
	}

	// Join the segments back together into a path
	const modifiedPath = segments.join("/");

	return modifiedPath;
}

export default {
	// @ts-ignore
	proxifiedObj: Proxy.revocable(import.meta.resolve, {
		apply(target, that, args) {
			const ret = Reflect.apply(target, that, args);

			// Prevent the paths from going behind the proxy origin
			let curr = ret;
			while (
				!new URL(curr, proxyLocation().href).href.startsWith(
					proxyLocation().href
				)
			) {
				curr = removeOneLevel(curr);
			}
			return curr;
		}
	}),
	// TODO: Define on $aero
	globalProp: "<proxyNamespace>.moduleScripts.resolve"
} as APIInterceptor;
