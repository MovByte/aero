import config from "$aero/examples/config";
import type { APIInterceptor } from "$types/apiInterceptors.d.ts";
const { prefix } = config;

import { storageNomenclature } from "./shared";

// TODO: Import types for the Shared Storage API
// TODO: Proxify it with the new system
/*
if (flags.nonstandard && "sharedStorage" in window) {
	// @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Shared_Storage_API}
	// @see {@link https://developers.google.com/privacy-sandbox/relevance/shared-storage}
	window.sharedStorage =
  }
  */

export default [
	{
		proxifiedObj: Proxy.revocable(window.sharedStorage, {
			apply(target, that, args) {
				// TODO: Implement
				return Reflect.apply(target, that, args);
			}
		}),
		globalProp: "sharedStorage"
	}
] as APIInterceptor[];
