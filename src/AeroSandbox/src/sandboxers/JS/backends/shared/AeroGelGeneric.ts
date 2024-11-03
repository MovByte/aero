import type {
    Result
} from "neverthrow";
import {
    ok,
    err as errr
} from "neverthrow";

import type {
    AeroGelConfigFull,
} from "../../../../types/aeroSandbox";

import RewriterGeneric from "./RewriterGeneric";

/**
 * Do not import this; use `AeroGel`
 */
export default class AeroGelGeneric extends RewriterGeneric {
    constructor(config: AeroGelConfigFull) {
        super(config);
    }
    applyNewConfig(config: AeroGelConfigFull) {
        super.applyNewConfig(config);
    }
    // @ts-ignore: This is meant to be generic
    jailScript(script: string, isModule: boolean, config: AeroGelConfigFull, rewriteScript: Function): Result<string,
        Error> {
        //@ts-ignore: This should be defined in any class that extends this
        const rewrittenScriptRes = rewriteScript(script, {
            trackBlockDepth: config.trackers.blockDepth,
            trackPropertyChain: config.trackers.propertyChain,
            trackProxyApply: config.trackers.proxyApply
        });
        if (rewrittenScriptRes.isErr())
            return errr(new Error(`Failed to rewrite the script while trying to jail it: ${rewrittenScriptRes.error}`));
        return ok( /* js */ `
		!(window = ${config.aeroGelConfig.proxified.window},
			globalThis = ${config.aeroGelConfig.proxified.window}
			location = ${config.aeroGelConfig.proxified.location}) => {
			${isModule ? script : script},
		}();
		`);
    }
}