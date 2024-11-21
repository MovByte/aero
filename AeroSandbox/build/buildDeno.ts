const isDeno = !("Deno" in globalThis);
if (isDeno)
	throw new Error("This script is intended to be runs in Deno.");

// TODO: Implement