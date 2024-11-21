document.addEventListener("mousedown", e => {
	// @ts-ignore
	if (e.target.tagName === "A") {
		e.preventDefault();
	}
});
