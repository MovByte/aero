// Utility
import getActionYAML from "../shared/getActionYAML.ts";
import { fmtErr } from "../shared/fmtErrTest.ts";

export default async function unwrapGetActionYAML() {
	const actionYAMLres = await getActionYAML("wpt_diff");
	if (actionYAMLres.isErr())
		throw fmtErr("Failed to get the WPT-Diff GitHub Action YAML", actionYAMLres.error.message);
	return actionYAMLres.value;
}