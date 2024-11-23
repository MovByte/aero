import type { getReqDest } from "../fetchHelpers/getReqDest"

declare global {
	var getReqDest: getReqDest;
	var serverFetch: (url: string, init?: RequestInit) => Promise<Response>;
}