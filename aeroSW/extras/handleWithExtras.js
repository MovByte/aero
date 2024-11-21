{
	function wrapLink(link) {
		const wrappedLink = link.replace(/:\d+:\d+$/g, "");

		return `<a href="${wrappedLink}">${wrappedLink}</a>`;
	}

	function fmtErr(stack) {
		return (
			stack
				// Put locations on a new line and tab
				.split("at ")
				.map(loc =>
					loc.replace(/^(http:|https:).+/gm, m => wrapLink(m))
				)
				.join("<br>&emsp;")
				// Bold the error
				.replace(/(^[^:]*)(?:: )([^:]*)/g, "<b>$1</b>: <i>$2</i>")
				// Format the links
				.replace(/\(([^()]*)\)/gms, (_m, g1) => `(${wrapLink(g1)})`)
		);
	}

	/* This patches the original aero handler to add a custom error page */
	self.patchAeroHandler = (originalHandle, proxyNameCapitalized = "Aero") => {
		return async event =>
			originalHandle(event).catch(err => {
				setTimeout(() => {
					throw err;
				}, 500);
				return new Response(
					/* html */ `
<!DOCTYPE html>
<html>
<body>
  <style>
    body {
      font-family: arial, sans-serif;
    }
    #err {
      font-family: monospace;
    }
  </style>
  <h1 id="title" style="color: red">${proxyNameCapitalized} Bug</h1>
  <p id="err">${fmtErr(err.stack)}<br>${err.cause}<p>
  <script type="module">
    import ProxyManager from "/scripts/sdk/ProxyManager.js";
    const proxyManager = new ProxyManager();
    proxyManager.add("/sw.js", prefix);
  </script>
</body>
</html>
    `,
					{ headers: { "content-type": "text/html" }, status: 500 }
				);
			});
	};
}
