/**
 * @module
 */

import type {
    AeroJSParserConfig,
    RewriteOptions,
    aerogelParser,
    astParser,
    astWalker
} from "../../../types/rewriters/js";

import ASTRewriter from "./backends/AST";
import AeroGel from "./backends/AeroGel";

// TODO: Support map proxying, where if the Feature Flag JS_MAP_REWRITING is enabled, any changes to the JS file post-rewrite will be reflected in the Source Map. A Source Map comment directive will be added if there wasn't one already. In the SW, if there is a valid JS response for a Source Map request, I will use that Source Map against the original unrewritten response for the JS file, apply my rewriting to that, and then take the Source Map from that to reformat it. This will allow for a seamless debugging experience in the browser.
/**
 * @module
 *
 * @example
 *  // This example shows using the JS Rewriter just for AeroGel
 *  import AeroSandbox from "aero-sandbox";
 *
 *  import JSRewriter from "aero-sandbox/JSRewriter";
 *  import escapeJS from "aero-sandbox/JSRewriter/escapeJS";
 *  import integral from "aero-sandbox/JSRewriter/integralJS";
 *  // Globals
 *  window.testProxyNamespace = {};
 *
 *  // Constants
 *  const yourScript = "...";
 *  const testProxyNamespace = "testGlobalNamespace";
 *  const ourNamespace = "sandbox";
 *  const isModule = false;
 *
 *  const jsRewriter = new JSRewriter({
 *      proxyNamespace: testProxyNamespace,
 *      modeDefault: "aerogel",
 *      modeModule: "aerogel",
 *      modeConfigs: {
 *          generic: {
 *              proxyNamespace: testProxyNamespace,
 *              objPaths: {
 *                  proxy: {
 *                      fakeVars: {
 *                          let: `window["${testProxyNamespace}"]["${ourNamespace}"]aeroGel.fakeVarsLet`,
 *                          const: `window["${testProxyNamespace}"]["${ourNamespace}"]aeroGel.fakeVarsConst`
 *                      }
 *                  }
 *              }
 *          }
 *      },
 *      preferredParsers: {
 *          aerogel: ["seafox"]
 *      },
 *      preferredASTWalkers: ["traverse_the_universe"]
 *  });
 *
 *  const aeroSandbox = new AeroSandbox({
 *      config: {
 *          proxyNamespace: testProxyNamespace,
 *          ourNamespace,
 *          configKey: "config",
 *          bundles: {
 *              main: "./sandbox.js"
 *          },
 *          rewriters: {
 *              jsLib: self.JSRewriter,
 *          },
 *          featureFlags: {
 *              includeAstParserSeafox: true,
 *              includeAstWalkerTraverseTheUniverse: true
 *          },
 *          featureConfig: {
 *              apiIncludeBitwiseEnum: "fake_vars_and_global_only",
 *              apiExcludeBitwiseEnum: "fake_vars_and_global_only"
 *          }
 *      }
 *  });
 *
 *  // Example of how you would use it
 *  yourScript = jsRewriter.wrapScript(yourScript, {
 *      isModule,
 *      insertCode: /* js *\/ `
 *          {
 *              const bak = decodeURIComponent(escape(atob(\`${escapeJS(script)}\`)));
 *              ${integral(isMod)}
 *          }
 *      `
 *  });
*/
export default class JSRewriter {
    config: AeroJSParserConfig;
    constructor(config: AeroJSParserConfig) {
        this.config = config;
    }
    applyNewConfig(config: AeroJSParserConfig) {
        this.config = config;
    }
    rewriteScript(script: string, rewriteOptions: RewriteOptions): string {
        if (rewriteOptions.isModule) {
            if (this.config.modeModule === "ast")
                return this.astRewrite(script, rewriteOptions.isModule);
            if (this.config.modeModule === "aerogel")
                return this.aerogelRewrite(script, rewriteOptions.isModule);
        } else {
            if (this.config.modeDefault === "ast")
                return this.astRewrite(script, rewriteOptions.isModule);
            if (this.config.modeDefault === "aerogel")
                return this.aerogelRewrite(script, rewriteOptions.isModule);
        }
        return script;
    }
    /** Calls the AST Rewriter with the config that you provided in the constructor earlier */
    astRewrite(script: string, isModule: boolean): string {
        let parserOfChoice: astParser;
        let walkerOfChoice: astWalker;
        for (const astParser of this.config.preferredParsers.ast) {
            const astSupportedParsers = ASTRewriter.supportedParsers();
            if (astParser in astSupportedParsers)
                parserOfChoice = astParser;
        }
        if (!parserOfChoice) {
            $aero.logger.fatalErr(
                "No compatible AST parsers found with your preferred list of parsers!"
            );
            return script;
        }
        for (const astWalker of this.config.preferredASTWalkers) {
            const astSupportedWalkers = ASTRewriter.supportedWalkers();
            if (astWalker in astSupportedWalkers) walkerOfChoice = astWalker;
        }
        if (!walkerOfChoice) {
            $aero.logger.fatalErr(
                "No compatible AST walkers found with your preferred list of walkers!"
            );
            return script;
        }

        // @ts-ignore
        const astRewriter = new ASTRewriter({
            parserConfig: {
                parser: parserOfChoice
            },
            walkerConfig: {
                walker: walkerOfChoice
            }
        });
        return astRewriter.rewriteScript(script, isModule);
    }
    aerogelRewrite(script: string, isModule: boolean): string {
        let parserOfChoice: aerogelParser;
        for (const aerogelParser of this.config.preferredParsers.aerogel) {
            const aerogelSupportedParsers = AeroGel.supportedParsers();
            if (aerogelParser in aerogelSupportedParsers)
                parserOfChoice = aerogelParser;
        }
        if (!parserOfChoice)
            $aero.logger.fatalErr(
                "No compatible AeroGel parsers found with your preferred list of parsers!"
            );

        // @ts-ignore
        const aerogelRewriter = new AeroGel({
            parserConfig: {
                parser: parserOfChoice
            }
        });
        return aerogelRewriter.jailScript(script, isModule);
    }
    /** This is the method you want to use in your proxy */
    wrapScript(script: string, rewriteOptions: RewriteOptions): string {
        const lines = this.rewriteScript(script, rewriteOptions).split("\n");

        const [first] = lines;

        const _meta = rewriteOptions.isModule
            ? `${this.config.proxyNamespace}.moduleScripts.resolve`
            : "";

        lines[0] = rewriteOptions.insertCode + _meta + first;

        return lines.join("\n");
    }
}
