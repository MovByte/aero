// TODO: Make this a separate bundle `dist/winter/bareMuxShim.js`
export default {
	BareClient: class {
		fetch() {
			return fetch(...arguments);
		}
	}
};
