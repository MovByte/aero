// aeroConfig is defined when you import `config.js`
// dropdownEl should be whatever element your proxy switcher is
dropdownEl.addEventListener("submit", event => {
	navigator.serviceWorker.getRegistration(aeroConfig.prefix).then(reg => {
		if (reg) {
			reg.active.postMessage({
				type: "switchProxy",
				data: this.value
			});
		}
	});
});
