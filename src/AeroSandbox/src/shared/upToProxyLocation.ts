import { proxyLocation } from "./proxyLocation";

import type { AeroLogger, AeroSandboxLogger } from "./Loggers";

export default (prefix: string, logger: AeroSandboxLogger | AeroLogger) => prefix + proxyLocation(prefix, logger).origin;
