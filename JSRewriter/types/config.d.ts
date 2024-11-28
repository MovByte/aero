export default interface RewriterConfig {
    globalsConfig: {
        propTrees: {
            fakeLet: string;
            fakeConst: string;
        };
        proxified: {
            evalFunc: string;
            location: string
        };
        checkFunc: string
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