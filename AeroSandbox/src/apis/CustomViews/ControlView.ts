class ControlView extends HTMLIFrameElement {
	constructor() {
		super();
	}
	connectedCallback() {
		super.src;
	}
}

customElements.define("aerosandbox-controlview", ControlView);
// TODO: When ControlViews feature flag is enabled, also import concealers for custom elements so that it can't read these `aerosandbox-...` tags, but also, so that they can't register custom elements under the same tag name as the ones with aerosandbox, but then you also have to write code in the HTML rewriter/interceptor to correct use into the new prefixed name. TODO: make a flag for enabling this specific concealment feature.
