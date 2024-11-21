// For node (do not import in the browser)
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const aeroSandboxPath = resolve(__dirname, "../..", "dist");

export default aeroSandboxPath;
