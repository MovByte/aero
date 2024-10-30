/**
 * Do not import this; it is used internally by `AeroGelGeneric` and `AeroJetAST`
 */
export default class RewriterGeneric {
	// @ts-ignore: This is meant to be generic
	config: any;
	// @ts-ignore: This is meant to be generic
	constructor(config: any) {
		this.config = config;
	}
	// @ts-ignore: This is meant to be generic
	applyNewConfig(config: any) {
		this.config = config;
	}
}