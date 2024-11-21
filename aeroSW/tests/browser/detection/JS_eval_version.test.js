{
	const originalJsTests = document.getElementById("JS_test");

	if (!originalJsTests)
		throw new Error("The original JS rewrite tests are missing!");

	const evalTestsContent = /* js */ `
  tests.set = new Proxy(tests.set, {
    apply(target, that, args) {
      const [testName] = args;
      if (testName)
        args[0] = \`\${testName} - eval version\`;
      return Reflect.apply(target, that, args);
    }
  })

  ${originalJsTests.textContent}
  `;

	eval(evalTestsContent);

	new Function(evalTestsContent)();
}
