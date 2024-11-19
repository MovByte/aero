export default /* ts */ `
	if (
		// FIXME: Doesn't work in async scripts like found on https://discord.com/
		document.currentScript &&
		document.currentScript.hasAttribute("_integrity")
	)
		window[{{PROXY_NAMESPACE_OBJ}}][{{AERO_SANDBOX_NAMESPACE_OBJ}}].awaitSync(calc(
			document.currentScript._integrity,
			document.currentScript.innerHTML
		))();
	};
`;