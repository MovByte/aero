/**
 * @module
 * This module contains functions for getting the proxy location from the real location
 */

import getConfig from "$shared/getConfig";

import { afterPrefix } from "../shared/getProxyURL";

import { AeroLogger, AeroSandboxLogger } from "./Loggers";

/**
 * Get the proxy location from the real location
 * @param prefix The proxy prefix of the proxy
 * @param logger The logger to use
 */
export function proxyLocation(prefix = $aero.config.prefix, logger: AeroSandboxLogger | AeroLogger = $aero.logger): URL {
	return new URL(afterPrefix(location.href, prefix, logger));
}
/**
 * TODO: ...(forgot what this does myself);
 * @param prefix The proxy prefix of the proxy
 * @param logger The logger to use
 */
export function upToProxyOrigin(prefix = $aero.config.prefix, logger: AeroSandboxLogger | AeroLogger = $aero.logger): string {
	return prefix + proxyLocation(prefix, logger).origin;
}
