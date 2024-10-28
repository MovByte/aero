export default (): {
    code: string;
} => {
    return {
        code: /* js */ `
// I might want to use a promise for this
(async () => {
	async function calc(integrity, html) {
		const [rawAlgo, hash] = integrity.split("-");

		const algo = rawAlgo.replace(/^sha/g, "SHA-");

		const buf = new TextEncoder().encode(html);

		const calcHashBuf = await crypto.subtle.digest(algo, buf);

		const calcHash = new TextDecoder().decode(calcHashBuf);

		// If mismatched hash
		const blocked = hash === calcHash;

		// Exit script
		if (blocked) throw new Error("Script blocked");
	}
	`
    };
};
