/**
 * @module
 * TODO: Write...
 */

 /**
 * Wraps `exec` from `node: child_process` with a promise form and safe handling of errors
 * @param cmd From the original `exec` function
 * @param cwd From the original `exec` function
 */
 // @ts-ignore
export async function safeExec(cmd: string, cwd: any) {
    try {
        // @ts-ignore
        const { stdout, stderr } = await promisify(exec)(cmd, cwd);
        if (stderr) console.error(stderr);
        // @ts-ignore
    } catch (err: any) {
        throw new Error(`Failed to execute ${cmd}: ${err.message}`);
    }
}