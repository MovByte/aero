// For node (do not import in the browser)
const { resolve } = require("node:path");

const aeroSandboxPath = resolve(__dirname, "../..", "dist");

module.exports = aeroSandboxPath;
