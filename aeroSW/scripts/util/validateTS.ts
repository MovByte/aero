import { createCompilerHost, createProgram, getPreEmitDiagnostics } from "typescript";

/**
 * This works by creating a TS program in a virtual environment (in the latest TS version) and returning any errors that occur if they are found
 * @param code The code to validate
 * @returns An array of the diagnostic errors that occurred when trying to compile the code. The TS is valid if the array is empty.
 */
/* biome-enable no-param-reassign */
async function validateTS(code: string): string[] {

}