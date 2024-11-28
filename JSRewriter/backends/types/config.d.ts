// TODO: Document the props with JSDoc
export default interface RewriterConfig {
	globalsConfig: {
		aeroGel?: {
			propTrees: {
				fakeLet: string;
				fakeConst: string;
				proxified: {
					window: string
					location: string
				}
			},
			proxified: {
				evalFunc: string;
				location: string
			}
		}
		generic: {
			escapedPropTrees: string[],
			checkFunc: string
		}
	};
	keywordGenConfig: {
		supportStrings: true;
		supportTemplateLiterals: true;
		supportRegex: true;
	};
	trackers: {
		blockDepth: true;
		propertyChain: true;
		proxyApply: true
	}
}