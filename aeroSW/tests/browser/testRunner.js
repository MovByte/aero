// TODO: Update this file to reflect the new changes in the JSRewriter's APIs

/*
// Manage "imports"
const replaceProxyNamespace = Mod.replaceProxyNamespace.default;

const jsRewriterConfigGeneric = {
	modeConfigs: {
		generic: {
			proxyNamespace: testProxyNamespace,
			objPaths: {
				proxy: {
					window: "",
					location: ""
				},
				fakeVars: {
					let: `window["${testProxyNamespace}"].aeroGel.fakeVarsLet`,
					const: `window["${testProxyNamespace}"].aeroGel.fakeVarsConst`
				}
			}
		}
	},
	preferredASTWalkers: []
};

const jsRewriterConfigAeroJet = {
	...jsRewriterConfigGeneric,
	modeDefault: "aerojet",
	modeModule: "aerojet"
};

const jsRewriterConfigAeroGel = {
	...jsRewriterConfigGeneric,
	modeDefault: "aerogel",
	modeModule: "aerogel",
	modeConfigs: {
		...jsRewriterConfigGeneric.modeConfigs.generic,
		objPaths: {
			...jsRewriterConfigGeneric.modeConfigs.generic.objPaths,
			fakeVars: {
				let: `window["${testProxyNamespace}"].aeroGel.fakeVarsLet`,
				const: `window["${testProxyNamespace}"].aeroGel.fakeVarsConst`
			}
		}
	}
};

let sandboxingAPIInterceptorInjects = "";

const jsSandboxingModule = Mod.scriptSandbox;
for (const [_apiInterceptor, ctx] of Object.entries(jsSandboxingModule))
	if (ctx.proxifiedObj) {
		const globalProp = replaceProxyNamespace(
			ctx.globalProp,
			testProxyNamespace
		);
		const lastPropOfGlobalProp = globalProp.split(".").at(-1);
		if (lastPropOfGlobalProp === "proxifiedWindow")
			jsRewriterConfigGeneric.modeConfigs.generic.objPaths.proxy.window =
				globalProp;
		if (lastPropOfGlobalProp === "proxifiedLocation")
			jsRewriterConfigGeneric.modeConfigs.generic.objPaths.proxy.location =
				globalProp;

		sandboxingAPIInterceptorInjects += `window${globalProp} =
			${ctx.proxifiedObj.toString()};`;
	}
const locationSandboxingModule = Mod.location.default;
for (const [_apiInterceptor, ctx] of Object.entries(locationSandboxingModule))
	if (ctx.proxifiedObj)
		sandboxingAPIInterceptorInjects += `window${replaceProxyNamespace(
			ctx.globalProp,
			testProxyNamespace
		)} = ${ctx.proxifiedObj.toString()}`;

const jsRewriterAST = new JSRewriter(jsRewriterConfigAeroJet);
const jsRewriterAeroGel = new JSRewriter(jsRewriterConfigAeroGel);

function scopeFunction(func, type) {
	new Function(
		sandboxingAPIInterceptorInjects +
			(type === "ast" ? jsRewriterAST : jsRewriterAeroGel).wrapScript(
				replaceProxyNamespace(func.toString(), testProxyNamespace),
				{
					rewriteOptions: {
						isModule: false
					}
				}
			)
	)();
}

async function runTests() {
	for (const [testType, testHandler] of tests.entries()) {
		if (testHandler.constructor.name === "GeneratorFunction") {
			if (testType.startsWith("scoping -")) {
				const testRunnerAST = scopeFunction(testHandler, "ast");
				runGeneratorTests(`${testType} - AST version`, testRunnerAST);
				/*
        const testRunnerAeroGel = scopeFunction(testHandler, "aerogel");
        runGeneratorTests(`${testType} - AeroGel version`, testRunnerAeroGel);
        */
			} else runGeneratorTests(testType, testRunner);
		} else if (testHandler.constructor.name === "AsyncFunction") {
			const testPassed = testType.startsWith("scoping -")
				? await scopeFunction(testHandler)()
				: await testHandler();
			if (!testPassed) failedTests.push([testType]);
		} else if (testHandler instanceof Function) {
			const testPassed = testType.startsWith("scoping -")
				? scopeFunction(testHandler)()
				: testHandler();
			if (!testPassed) failedTests.push([testType]);
		}
	}
}

function runGeneratorTests(testType, testRunner) {
  for (; ;) {
		const { done, value } = testRunner.next();
		if (done) break;
		const testRes = value;
		failedTests.push([testType, ...testRes]);
	}
}

// This is currently for debug and is temporary
runTests().then(() => {
	for (const failedTest of failedTests) {
		console.log("Failed test:", failedTest);
	}
});
*/