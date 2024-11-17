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
 * @typedef {import("@swc/core").Module} SWCModule
 */
import { transformSync, parseSync, printSync } from "@swc/core";

/**
 * A `require` function made with `createRequire`
 */
const requireForMods = createRequire(import.meta.url);

/**
 * The filenames to resolve with NPM modules
 */
const filenamesToResolveWithNPM = ["codecs.js", "locvar.ts", "comp.ts"];
const injDeps = {};
const injDepsUrlContains = {
  "Nebelung-Dev/Ultraviolet": JSON.stringify("fake-indexeddb/auto"),
};

/**
 * This node resolver is used to load modules over a HTTPS URL
 */
export function load(url, _ctx, nextLoad) {
  if (url.startsWith("https://")) {
    return new Promise((resolve, reject) => {
      get(url, (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (data += chunk));
        res.on("end", async () => {
          const resolveFilename = url.split("/").at(-1);
          // Process the code if needed
          for (const targetFilename of filenamesToResolveWithNPM) {
            if (resolveFilename.startsWith(targetFilename)) {
              for (const [targetFilenameInjDeps, importRest] of Object.entries(
                injDeps,
              ))
                if (url.endsWith(targetFilenameInjDeps))
                  // Inject this dependency into the source code because the original source code was meant to be run in a browser environment
                  data = `import ${importRest};\n` + data;
              for (const [
                targetStrContainsInjDeps,
                importRest,
              ] of Object.entries(injDepsUrlContains))
                if (url.includes(targetStrContainsInjDeps))
                  // Inject this dependency into the source code because the original source code was meant to be run in a browser environment
                  data = `import ${importRest};\n` + data;
              /** The source with NPM modules resolved to absolute file URLs */
              data = transformImports(data, url);
            }
          }
          if (
            url.startsWith(
              "https://gist.githubusercontent.com/theogbob/89bfd228d7ec646bac14db867f33b8b2/raw/09cac229de8fa84db84111218ed8cbc020627e44/sillyxor.js",
            )
          ) {
            /** @type {String[]} */
            const newLines = [];
            for (const line of data.split("\n"))
              if (!line.startsWith("console.log")) newLines.push(line);
            newLines.push("export default bobXORfunctions;");
            data = newLines.join("\n");
          }

          // Resolve TS to JS (strip types)
          if (resolveFilename.endsWith(".ts"))
            try {
              data = transformSync(data, {
                jsc: {
                  parser: {
                    syntax: "typescript",
                  },
                },
              }).code;
              if (
                url.startsWith(
                  "https://raw.githubusercontent.com/MeteorProxy/meteor/refs/heads/main/src/codecs/locvar.ts",
                )
              ) {
                /** @type {String[]} */
                const newLines = [];
                for (const line of data.split("\n")) {
                  if (!line.startsWith("export var")) newLines.push(line);
                }
                newLines.push("export default factory;");
                data = newLines.join("\n");
              }
            } catch (err) {
              reject(err);
            }

          resolve({
            format: "module",
            shortCircuit: true,
            source: data,
          });
        });
      }).on("error", (err) => reject(err));
    });
  }

  // Let Node.js handle the other modules natively
  return nextLoad(url);
}

/**
 * Transforms import statements in the source code to resolve NPM modules to absolute file URLs when needed
 * @param {string} code The source code to transform
 */
function transformImports(code, url) {
  /** @type {SWCModule} */
  let ast;
  try {
    ast = parseSync(code, {
      syntax: "typescript",
    });
  } catch (err) {
    throw new Error(`Failed to parse the source code into AST: ${err}`);
  }
  const transformedAst = {
    ...ast,
    body: ast.body
      .map((node) => {
        if (node.type === "ImportDeclaration") {
          const oldModName = node.source.value;
          if (!node.source.value || node.typeOnly)
            // Schedule the node for deletion since it is a type-only import
            return "delete";

          /** If the module we are looking at is imported with external HTTPS imports */
          const externalSources =
            oldModName.startsWith("https://") ||
            oldModName.startsWith("http://");
          /** If the module we are looking at is imported with relative imports */
          const relativeImports = oldModName.startsWith(".");

          // Don't modify external HTTPS imports (they should be handled by the hooks) or relative imports (they are already FS imports)
          if (!(externalSources || relativeImports)) {
            try {
              // Resolve NPM module imports -> absolute file URLs
              const resolvedPath = requireForMods.resolve(oldModName);
              const absPath = pathResolve(resolvedPath);
              const absFileUrl = pathToFileURL(absPath).href;

              return {
                ...node,
                source: {
                  ...node.source,
                  value: absFileUrl,
                  raw: JSON.stringify(absFileUrl),
                },
              };
            } catch (err) {
              throw new Error(
                `Failed to resolve module "${oldModName}": ${err}\nPerhaps you should install it (npm i ${oldModName})?`,
              );
            }
          }
        }
        // Don't modify the node
        return node;
      })
      .filter((node) => node !== "delete"),
  };
  const { code: transformedCode } = printSync(transformedAst);

  return transformedCode;
}
