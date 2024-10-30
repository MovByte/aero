import type {
    Result
} from "neverthrow";
import {
    ok,
    err as errr
} from "neverthrow";

import type {
    AeroGelConfig,
} from "../../../../types/aeroSandbox";

import RewriterGeneric from "./RewriterGeneric";

/**
 * Do not import this; use `AeroGel`
 */
export default class AeroGelGeneric extends RewriterGeneric {
    constructor(config: AeroGelConfig) {
        super(config);
    }
    applyNewConfig(config: AeroGelConfig) {
        super.applyNewConfig(config);
    }
    // @ts-ignore: This is meant to be generic
    jailScript(script: string, config: any, isModule: boolean): Result<string,
        Error> {
        //@ts-ignore: This should be defined in any class that extends this
        const rewrittenScriptRes = this.rewriteScript(script);
        if (rewrittenScriptRes.isErr())
            return errr(new Error(`Failed to rewrite the script while trying to jail it: ${rewrittenScriptRes.error}`));
        return ok( /* js */ `
		!(window = ${this.config.objPaths.proxy.window},
			globalThis = ${this.config.objPaths.proxy.window}
			location = ${this.config.objPaths.proxy.location}) => {
			${isModule ? script : script},
		}();
		`);
    }
}