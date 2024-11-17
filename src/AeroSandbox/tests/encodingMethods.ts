/**
 * @module
 * This file contains all of the tests and benchmarks for the encoding methods in AeroSandbox.
 * This module is exposed as a CLI.
 * The CLI here will be used for a GitHub Action, which will be published on the GitHub Marketplace.
 * In addition, this module will be published on NPM and JSR.
 */

import type { ResultAsync } from "neverthrow";
import { okAsync } from "neverthrow";

import test from "node:test";

import { Bench } from "tinybench";
import type { Options } from "tinybench";

// @ts-ignore This is a module inside of a test, which means it isn't built, but run directly by node, so ignore what the linter says
import { fmtErr, fmtNeverthrowErr } from "./shared/fmtErrTest.ts";

// @ts-ignore This is a module inside of a test, which means it isn't built, but run directly by node, so ignore what the linter says
import getUrlTestData from "./shared/getUrlTestData.ts";

// @ts-ignore This is a module inside of a test, which means it isn't built, but run directly by node, so ignore what the linter says
import PrecompXOR from "../src/util/encoding/PrecompXOR.ts";

async function testEncodingMethods() {
	// TODO: Implement...
}

/**
 * Creates a benchmark for the encoding methods used in aero and AeroSandbox
 * @returns The benchmark for the encoding methods wrapped in a `ResultAsync` from *Neverthrow* for safety
 */
async function createBenchEncodingMethods(benchOptions: Options): Promise<ResultAsync<Bench, Error>> {
	let bench: Bench;
	try {
		bench = new Bench(benchOptions);
	} catch (err: any) {
		return fmtNeverthrowErr("Failed to create the benchmark for encoding methods", err.message, true);
	}

	/** The URLs to get with */
	let testUrlsRes = await getUrlTestData();
	if (testUrlsRes.isErr())
		return fmtNeverthrowErr("Failed to get test URLs required for benchmarking the encoding methods", testUrlsRes.error.message, true);
	const testUrls = testUrlsRes.value;

	// Init the encoders
	const precompXOR = new PrecompXOR(["2"]);
	const uvCodecs: {
		none: {
			encode: (str: string) => string;
			decode: (str: string) => string;
		}
		plain: {
			encode: (str: string) => string,
			decode: (str: string) => string,
		}
		xor: {
			encode: (str: string) => string,
			decode: (str: string) => string,
		};
		base64: {
			encode: (str: string) => string,
			decode: (str: string) => string,
		};
		getOrSetIdb: (storeName: string, key: string) => void;
		nebelcrypt: {
			encode: (str: string) => string,
			decode: (str: string) => string,
		}
		// @ts-ignore: Node can import from URLs with `httpHooks.js` pre-imported like how it is done in the package.json script to run this file
	} = await import("https://raw.githubusercontent.com/Nebelung-Dev/Ultraviolet/refs/heads/main/src/rewrite/codecs.js");
	const doNothingWithURL = (str: string) => str;

	bench.add("Precomputed XOR (with key `2`)", () => {
		for (const testUrl of testUrls) {
			const encUrlRes = precompXOR.encodeUrl(testUrl, "2");
			if (encUrlRes.isErr())
				throw fmtErr("Failed to encode the URL with precomputed XOR	", encUrlRes.error.message);
			const encUrl = encUrlRes.value;
			precompXOR.decodeUrl(encUrl, "2");
			//console.log(encUrl);
		}
	});
	bench.add("UV Codec - XOR (not from aero)", () => {
		for (const testUrl of testUrls) {
			//const encUrl = uvCodecs.xor.encode(testUrl);
			//uvCodecs.xor.decode(encUrl);
		}
	});
	bench.add("UV Codec - Base64 (not from aero)", () => {
		for (const testUrl of testUrls) {
			const encUrl = uvCodecs.base64.encode(testUrl);
			uvCodecs.base64.decode(encUrl);
		}
	});
	bench.add("UV Codec - Plain (not from aero)", () => {
		for (const testUrl of testUrls) {
			const encUrl = uvCodecs.plain.encode(testUrl);
			uvCodecs.plain.decode(encUrl);
		}
	});
	// Nebelcrypt itself is broken right now unfortunately, so this test is disabled
	/*
	bench.add("Nebelcrypt", async () => {
		for (const testUrl of testUrls) {
			const encUrl = await uvCodecs.nebelcrypt.encode(testUrl);
			await uvCodecs.nebelcrypt.decode(encUrl);
		}
	})
	*/
	// To establish a baseline
	bench.add("Nothing", () => {
		for (const testUrl of testUrls) {
			const encUrl = doNothingWithURL(testUrl);
			doNothingWithURL(encUrl);
		}
	})

	return okAsync(bench);
}

/**
 * Detect if the script is being ran as a CLI script and not as a module
 */
const isCLI =
	// For Deno
	// @ts-ignore: This is a module
	import.meta.main || true

if (isCLI) {
	(async () => {
		// TODO: Add a feature flag for iterations
		const benchEncodingMethodsResRes = await createBenchEncodingMethods({
			iterations: 1000
		});
		if (benchEncodingMethodsResRes.isErr()) {
			throw fmtErr("Failed to create the benchmarks for encoding methods", benchEncodingMethodsResRes.error.message);
		}
		const benchEncodingMethodsRes = benchEncodingMethodsResRes.value;
		await benchEncodingMethodsRes.run()
		console.table(benchEncodingMethodsRes.table());
	})();
}