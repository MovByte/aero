import AeroGlobalType from "$types/$aero.d.ts"

import typia from "typia";

const res: typia.IValidation = typia.validate<AeroGlobalType>($aero);
if (!res.success)
	// TODO: Accept an array into fatalErr to call console.error more than once
	$aero.logger.fatalErr(["Failed to validate aero's global namespace: ", res.errors]);