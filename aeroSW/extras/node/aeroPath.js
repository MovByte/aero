// For node (do not import in the browser)
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const aeroPath = resolve(__dirname, "../..", "dist", "sw");
const aeroExtrasPath = resolve(__dirname, "..", "extras");

export default aeroPath;
export { aeroExtrasPath };
