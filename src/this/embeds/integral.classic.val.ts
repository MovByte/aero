export default (): {
    code: string;
} => {
    return {
        code: /* js */`
if (
	// FIXME: Doesn't work in async scripts like found on https://discord.com/
	document.currentScript &&
	document.currentScript.hasAttribute("_integrity")
)
	await calc(
		document.currentScript._integrity,
		document.currentScript.innerHTML
	);
	`
    };
};
