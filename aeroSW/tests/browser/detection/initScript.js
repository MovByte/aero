// The rewriter must not have access to this script
const realWin = window;
const realLoc = location;

// testType, ...testRes[]
const failedTests = [];

// testName: string, testHandler: Generator<string[], void, boolean.[] | () => boolean | async () => Promise<boolean>
const tests = new Map();

const JSRewriter = Mod.jsRewriter.default;

window.$aero = {};

const testProxyNamespace = "$aero";

window[testProxyNamespace] = {};

$aero.logger = new Mod.loggers.AeroSandboxLogger();
