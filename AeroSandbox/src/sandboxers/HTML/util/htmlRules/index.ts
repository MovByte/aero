/**
 * @module
 * Aggregates all of the htmlRules into a single Map
 */

import type { htmlRule } from "$aero/types/htmlRules";

import setRulesContentRewriters from "./rewriteContent";
import setRulesLinks from "./rewriteLinks";
import setRulesCORS from "./cors";
import setRulesFrames from "./frame";
import setRulesForMediaEmulation from "./media";

// biome-ignore lint/suspicious/noExplicitAny: TODO: Make `any`, Element
const htmlRules = new Map<any, htmlRule>();

setRulesContentRewriters(htmlRules)
setRulesLinks(htmlRules);
if (FEATURE_CORS_EMULATION)
	setRulesCORS(htmlRules);
setRulesFrames(htmlRules);
setRulesForMediaEmulation(htmlRules);