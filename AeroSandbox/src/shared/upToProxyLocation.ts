import { proxyLocation } from "./proxyLocation";

import type { AeroLogger, AeroSandboxLogger } from "./Loggers";

export default (prefix: string = $aero.config.prefix, logger: AeroSandboxLogger | AeroLogger = $aero.logger) => prefix + proxyLocation(prefix, logger).origin;
