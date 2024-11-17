/**
 * @module
 * This is used to load modules over an HTTP URL, resolve NPM modules to absolute file URLs when needed, and inject dependencies into the source code.
 * There used to be a Node flag to where some of this wouldn't be needed, starting from Node version 17.6 `--experimental-network-imports`, but it got removed, so this is the only option.
 */
import { get } from "node:https";
import { createRequire } from "node:module";
import { resolve as pathResolve } from "node:path";
import { pathToFileURL } from "node:url";

/**
 * A `require` function made with `createRequire`
 */
const requireForMods = createRequire(import.meta.url);

/**
 * The filenames to resolve with NPM modules
 */
const filenamesToResolveWithNPM = ["codecs.js"];
const injDeps = {
	"codecs.js": ["\"fake-indexeddb/auto\""],
}

/**
 * This node resolver is used to load modules over a HTTPS URL
 */
export function load(url, _ctx, nextLoad) {
	if (url.startsWith("https://")) {
		return new Promise((resolve, reject) => {
			get(url, (res) => {
				let data = "";
				res.setEncoding("utf8");
				res.on("data", (chunk) => data += chunk);
				res.on("end", async () => {
					// Process the code if needed
					for (const targetFilename of filenamesToResolveWithNPM) {
						const resolveFilename = url.split("/").at(-1)
						if (targetFilename.startsWith(resolveFilename)) {
							for (const [targetFilenameInjDeps, importRest] of Object.entries(injDeps))
								if (url.endsWith(targetFilenameInjDeps))
									// Inject this dependency into the source code because the original source code was meant to be run in a browser environment
									data = `import ${importRest};\n` + data;
							/** The source with NPM modules resolved to absolute file URLs */
							data = transformImports(data, url);
						}
					}
					resolve({
						format: "module",
						shortCircuit: true,
						source: data,
					})
				});
			}).on("error", (err) => reject(err));
		});
	}

	// Let Node.js handle the other modules natively
	return nextLoad(url);
}

/**
 * Match ES6 imports with and without specifiers (e.g. `import "<module>"` and `import { x } from "<module>"`)
 */
const importRegex = /import\s+(?:(.*?)\s+from\s+)?['"]([^'"]+)['"]/g;

/**
 * Transforms import statements in the source code to resolve NPM modules to absolute file URLs when needed
 * @param {string} code The source code to transform
 */
function transformImports(code) {
	const transformedCode = code.replace(importRegex, (match, importSpecifiers, modName, modNameWithoutSpecifiers) => {
		/** The correct module name even when no import specifiers are used */
		const injModName = modName || modNameWithoutSpecifiers;

		/** If the module we are looking is imported with external HTTPS imports */
		const externalResource = modName.startsWith("http://") || modName.startsWith("https://");
		if (externalResource) {
			// Don't modify external HTTPS imports (they should be handled there)
			return match;
		} else if (modName.startsWith(".")) {
			// Don't modify relative imports
			return match;
		} else {
			// Resolve NPM module imports -> absolute file URLs
			try {
				const resolvedPath = requireForMods.resolve(modName);
				const absPath = pathResolve(resolvedPath);
				const absFileUrl = pathToFileURL(absPath).href;
				return `import ${importSpecifiers ? `${importSpecifiers} from "${absFileUrl}"` :
					// Bare imports
					`"${absFileUrl}"`}`;
			} catch (err) {
				throw new Error(`Failed to resolve module "${injModName}": ${err}`);
				return match;
			}
		}
	});

	return transformedCode;
}
