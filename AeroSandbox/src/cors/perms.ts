//import block from "./policy";

// Private scope
/*
{
	// Parse a permission policy
	const parsePerms = perms => {
		if (!perms) return [];

		const map = new Map();

		perms.split(",").forEach(v => {
			let [dir, allowList] = v.split("=");

			map[dir] = allowList.split(" ");
		});

		return map;
	};

	$aero.perms = new Map([
		...parsePerms($aero.sec.permsFrame),
		...parsePerms($aero.sec.perms),
	]);
}

const blockPerm = perm => block($aero.perms.get(perm));

const block = (api: keyof Window, type) =>
	(window[api] = Promise.reject(
		type ? new DOMException("", type) : new DOMException()
	));

if (blockPerm("accelerometer")) delete Accelerometer;
if (blockPerm("ambient-light-sensor")) delete AmbientLightSensor;
if (blockPerm("autoplay"))
	navigator.getAutoplayPolicy = () => "disallowed";
if (blockPerm("battery")) block(navigator.getBattery, "NotAllowedError");
if (blockPerm("camera"))
	block(navigator.mediaDevices.getUserMedia, "NotAllowedError");
if (blockPerm("display-capture"))
	block(navigator.mediaDevices.getDisplayMedia, "NotAllowedError");
if (blockPerm("document-domain"))
	Object.defineProperty(document, "domain", {
		set: () => {
			throw new DOMException("", "SecurityError");
		},
	});
if (blockPerm("encrypted-media"))
	block(navigator.mediaDevices.getUserMedia);
// TODO: execution-while-not-rendered
// TODO: execution-while-out-of-viewport
if (blockPerm("fullscreen"))
	Element.requestFullscreen = Promise.reject(new TypeError());
if (blockPerm("gamepad"))
	Navigator.getGamepads = () => {
		throw new DOMException("SecurityError");
	};
// ...
*/
