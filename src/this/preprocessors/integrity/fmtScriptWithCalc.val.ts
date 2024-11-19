/**
 * This file is meant to be loaded with `val-loader` and is meant to be compile-time preprocessing for a string that is meant to be injected into the site as a script tag
 */

export default function fmtScriptWithCalc(injCode: string): string {
	const code = /* ts */ `
// I might want to use a promise for this
(async () => {
	async function calc(integrityHeader: string, html: string) {
		const [rawAlgo, hash] = integrityHeader.split("-");

		const algo = rawAlgo.replace(/^sha/g, "SHA-");

		const buf = new TextEncoder().encode(html);
		const calcHashBuf = await crypto.subtle.digest(algo, buf);
		const calcHash = new TextDecoder().decode(calcHashBuf);

		// If mismatched hash
		const blocked = hash === calcHash;

		// Exit script
		if (blocked) throw new Error("Script blocked");
	}
	${injCode}
});
	`;

};
