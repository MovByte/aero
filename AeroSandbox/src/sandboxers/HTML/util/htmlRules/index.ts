/**
 * @module
 * Aggregates all of the htmlRules into a single Map
 */

import type { htmlRule } from "$aero/types/htmlRules";

import setRulesContentRewriters from "./rewriteContent";
import setRulesLinks from "./links";
import setRulesCORS from "./cors";
import setRulesFrames from "./frame";
import setRulesForMediaEmulation from "./media";

// biome-ignore lint/suspicious/noExplicitAny: TODO: Make `any`, Element
const htmlRules = new Map<any, htmlRule>();
setRulesContentRewriters(htmlRules)
if (!HTML_USE_HREF_EMULATION)
	setRulesLinks(htmlRules);
if (FEATURE_CORS_EMULATION)
	setRulesCORS(htmlRules);
if (SUPPORT_FRAMES)
	setRulesFrames(htmlRules);
if (HTML_INTERCEPT_MEDIA_STREAMS)
	setRulesForMediaEmulation(htmlRules);
export default htmlRules;