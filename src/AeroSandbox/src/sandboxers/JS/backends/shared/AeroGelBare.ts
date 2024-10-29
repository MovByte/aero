import type {
    Result,
    ok,
    err as errr
} from "neverthrow";

import type {
    AeroGelConfig,
    aerogelParser,
    keywordReplacementType
} from "../../../../types/aeroSandbox";

/**
 * Do not import this, use `AeroGelAst` or `AeroGelNative` (when it is completed)
 */
export default class AeroGel {
    config: AeroGelConfig;
    constructor(config: AeroGelConfig) {
        this.config = config;
    }
    applyNewConfig(config: AeroGelConfig) {
        this.config = config;
    }
    jailScript(script: string, config: isModule: boolean): Result < void,
    Error > {
        const rewrittenScriptRes = this.rewriteScript(script);
        if (rewrittenScriptRes.isErr())
            return errr(new Error(`Failed to rewrite the script while trying to jail it: ${err.message}`));
        return ok( /* js */ `
			!(window = $ {
			        this.config.objPaths.proxy.window
			    },
			    globalThis = $ {
			        this.config.objPaths.proxy.window
			    },
			    location = $ {
			        this.config.objPaths.proxy.location) => {
			        $ {
			            isModule ? script :
			        }
			    }();
		`);
    }
}