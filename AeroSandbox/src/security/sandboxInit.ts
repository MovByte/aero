$aero.sec.csp = JSON.parse(`[$aero.sec.headers.csp]`);
if ($aero.sec.clear)
	$aero.sec.clear = JSON.parse(`[${$aero.sec.headers.clear}]`);
// TODO: Parse and use in perms.ts
$aero.sec.perms = $aero.sec.perms.split(";");

// TODO: Use a proper immutable library for deep freezing
Object.seal($aero.sec);
