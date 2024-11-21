/**
 * @module
 * A strict XOR implementation for proxies that precomputes the XOR lookup tables for valid URL characters to save time since the same keys are being used.
 * You may find this on NPM/JSR at `aero-sandbox/encoding/xor.
 * You may run tests for encoders like this with the command `<npm/deno> run test: encoders` inside of `src/AeroSandbox/.`
 * You may run tests for encoders like this with the command `<npm/deno> run test: encoders` inside of `src/AeroSandbox/.`
 * This module provides an XOR class with methods to encode and decode URLs that can be imported and used in any proxy.
 * This is built as a separate module so you can import and load it.
 * It isn't imported directly into aero; you need to link it to your config.
 *
 * Here is an example for how you would use it in a proxy config like aero or UV:
 * @example
 * import PrecompXOR from "aero-sandbox/encoding/xor";
 *
 * const yourKey = "...";
 * const precompXOR = new PrecompXOR([yourKey])
 * self.config = {
 * 	...,
 * 	encodeUrl: (url) => {
 * 	  const encodedUrlRes = precompXOR.encodeUrl(url, yourKey);
 * 	  if (encodedUrlRes.isErr()) {
 *		return nErr(new Error(`Failed to encode the URL, ${url}: ${encodedUrlRes.error}`));
 *    }
 *    return ok(encodedUrlRes.value);
 * 	},
 * 	decodeUrl: (encUrl) => {
 * 	  const decodedUrlRes = precompXOR.decodeUrl(encUrl, yourKey);
 * 	  if (decodedUrlRes.isErr()) {
 * 		return nErr(new Error(`Failed to decode the URL, ${encUrl}: ${decodedUrlRes.error}`));
 * 	  }
 * 	  return ok(decodedUrlRes.value);
 *   }
 * }
 */

import type { GenericLogger } from "../Loggers";
import type { Err, Result } from "neverthrow";
import { ok, err as nErr } from "neverthrow";

// The only reason why I am using this version of `fmtError` is because there are test cases that run on this file. That is also why I am resolving this file with `.ts` at the end.

/** char, encodedChar **/
type Dictionary = Uint8Array;
/** The lookup tables */
/** key, the precomputed XOR lookup table **/
type LookupTable = Map<string, {
	urlLookupDictionary: Dictionary;
	decodeUrlLookupDictionary: Dictionary;
}>

/** Valid URL characters, including reserved ones */
const validUrlChars = "-_.~!$&'()*+,;=:/?@[]^|`{}|";
const charCodesInValidUrlChars: number[] = [];
for (let i = 0; i < validUrlChars.length; i++)
	charCodesInValidUrlChars.push(validUrlChars.charCodeAt(i));
Object.freeze(charCodesInValidUrlChars);

// # of digits chars (48-58; 10 characters) + # of uppercase letter chars (65-91; 26 characters) + # of lowercase letter chars (97-123; 26 characters) + # of symbols (validUrlChars.length - 1; 32 characters) = 92 = total # of characters
const maxCharCount = 92;

/**
 * This isn't your typical XOR encoder.
 * It precomputes the lookupTables into a map, but only for what would be in a valid URL, causing it to have smaller lookup tables.
 * This is ideal for proxies.
 */
export default class PrecompXOR {
	/** The corresponding lookup table required to encode the URL */
	lookupTable: LookupTable;
	logger?: GenericLogger;

	/**
	 * @param precompKeys The precomputed keys to use for the XOR lookup tables; think of it like caching. You may also precompute the keys by passing in a new key into the encodeUrl and decodeUrl methods.
	 */
	constructor(precompKeys: string[], logger?: GenericLogger) {
		this.lookupTable = new Map();
		this.logger = logger;

		// Precompute the keys for later
		for (const precompKey of precompKeys) this.#compKeyToDictionaries(precompKey);
	}

	/**
	 * Computes the XOR lookup table for a given key
	 * @param key The key to compute the lookup table for
	 */
	#compKeyToDictionaries(key: string): {
		urlLookupDictionary: Dictionary;
		decodeUrlLookupDictionary: Dictionary;
	} {
		const keyArr = new TextEncoder().encode(key);

		// Create lookup table for valid URL characters (65 characters)
		const urlLookupDictionary = new Uint8Array(maxCharCount);
		const decodeUrlLookupDictionary = new Uint8Array(maxCharCount);

		// Handle digits (0-9)
		for (let i = 48; i <= 57; i++) {
			const encChar = i ^ keyArr[i % keyArr.length];
			urlLookupDictionary[i - 48] = i ^ encChar;
			decodeUrlLookupDictionary[encChar] = i;
		}
		// Handle uppercase letters (A-Z)
		for (let i = 65; i <= 90; i++) {
			const encChar = i ^ keyArr[i % keyArr.length];
			urlLookupDictionary[i - 55] = encChar;
			decodeUrlLookupDictionary[encChar] = i;
		}
		// Handle lowercase letters (a-z)
		for (let i = 97; i <= 122; i++) {
			const encChar = i ^ keyArr[i % keyArr.length];
			urlLookupDictionary[i - 61] = encChar;
			decodeUrlLookupDictionary[encChar] = i;
		}
		// Handle symbols that can be in a URL
		for (let i = 0; i < validUrlChars.length - 1; i++) {
			const asciiCode = validUrlChars.charCodeAt(i);
			const encChar = asciiCode ^ keyArr[asciiCode % keyArr.length];
			urlLookupDictionary[asciiCode] = encChar;
			decodeUrlLookupDictionary[encChar] = asciiCode;
		}
		// FIXME: `Object.freeze(urlLookupDictionary);` doesn't work
		// FIXME: `Object.freeze(decodeUrlLookupDictionary);` doesn't work

		return { urlLookupDictionary, decodeUrlLookupDictionary };
	}

	/**
	 * Encodes a URL using the XOR lookup table that corresponds to the key
	 * @param urlStr The URL to encode
	 * @param key The key to encode the URL with (will try to use the precomputed lookup table if it exists)
	 * @returns The encoded URL
	 */
	encodeUrl(urlStr: string, key: string): Result<string, Error> {
		this.updateLookupTableIfNeeded(key);
		// @ts-ignore: the method updateLookupTable already creates it if it doesn't exist; don't worry
		const { urlLookupDictionary } = this.lookupTable.get(key);

		const textArr = new TextEncoder().encode(urlStr);
		const resultArr = new Uint8Array(textArr.length);

		// Encode using the URL lookup table
		for (let i = 0; i < textArr.length; i++) {
			const char = textArr[i];
			const validChar = this.checkValidChar(char);
			if (validChar) {
				/*
				FIXME: This is broken; I know
				if (!(char in urlLookupDictionary))
					return nErr(
						new Error(
							`Aero error: the character, ${char}, is missing from the lookup table but is in the checks. This is not your fault; it is aero's, which is precisely where it checks to see if it is a valid URL character.`
						)
					);
				*/
				resultArr[i] = urlLookupDictionary[char];
			} else
				return nErr(
					new Error(
						`User error: the character you provided, ${char}, is not in the lookup table. Perhaps it is not a valid URL character.`
					)
				);
		}

		return ok(new TextDecoder().decode(resultArr));
	}
	/**
	 * Decodes a URL using the XOR lookup table that corresponds to the key
	 * @param encUrlStr The encoded URL to decode
	 * @param key The key to decode the URL with (will try to use the precomputed lookup table if it exists)
	 * @returns The decoded URL
	 */
	decodeUrl(encUrlStr: string, key: string): Result<string, Error> {
		this.updateLookupTableIfNeeded(key);
		// @ts-ignore: the method updateLookupTable already creates it if it doesn't exist; don't worry
		const { decodeURLLookupDictionary } = this.lookupTable.get(key);

		const textArr = new TextEncoder().encode(encUrlStr);
		const resultArr = new Uint8Array(textArr.length);

		// Decode using the URL lookup table
		for (let i = 0; i < textArr.length; i++) {
			const char = textArr[i];
			const validChar = this.checkValidChar(char);
			if (!validChar) return this.fmtErrNotValidChar(char);
			if (!(char in decodeURLLookupDictionary))
				return this.fmtErrNotInLookupTable(char);
			resultArr[i] = decodeURLLookupDictionary[char];
		}

		return ok(new TextDecoder().decode(resultArr));
	}

	// Helper methods
	log(): void {
		// @ts-ignore
		// biome-ignore lint/style/noArguments: <explanation>
		if ("logger" in this) this.logger.debug(...arguments);
	}
	/**
	 * This wraps the `updateLookupTable` method here and extends it so that it only updates if it needs to and logs the action of updating
	 * This is a helper method meant to be for internal-use only, but it is exposed just in case you want to use it for whatever reason.
	 * @param key This parameter is passed into `updateLookupTable`
	 */
	updateLookupTableIfNeeded(key: string): void {
		if (!this.lookupTable.has(key)) {
			this.updateLookupTable(key);
			// @ts-ignore
			this.log(`The lookup table for the key, ${key}, was not found, so it was created`);
		}
	}
	/**
	 * Creates the precomputed dictionaries for a lookup table with a given key if one doesn't already exist
	 * This is a helper method meant to be for internal-use only, but it is exposed just in case you want to use it for whatever reason.
	 * @param key The key to get the lookup table for
	 */
	updateLookupTable(key: string): void {
		// Only one needs to be checked since they are both updated at the same time
		if (!this.lookupTable.has(key)) {
			const { urlLookupDictionary, decodeUrlLookupDictionary } = this.#compKeyToDictionaries(key);
			this.lookupTable.set(key, { urlLookupDictionary, decodeUrlLookupDictionary });
		}
	}
	/**
	 * Checks if a character is a valid URL character.
	 * This is a helper method meant to be for internal-use only, but it is exposed just in case you want to use it for whatever reason.
	 * @see https://url.spec.whatwg.org/#valid-url-character
	 * @param char The character to check
	 * @returns If the character is a valid URL character
	 */
	checkValidChar(char: number): boolean {
		return (
			(char >= 48 && char <= 57) ||
			(char >= 65 && char <= 90) ||
			(char >= 97 && char <= 122) ||
			// @ts-ignore
			charCodesInValidUrlChars.includes(char)
		);
	}
	/**
	 * Creates *Neverthrow* Error when a character missing from the lookup table.
	 * This is a helper method meant to be for internal-use only, but it is exposed just in case you want to use it for whatever reason.
	 * @param char The character that is missing from the lookup table
	 * @returns The properly formatted Neverthrow Error
	 */
	fmtErrNotValidChar(char: number): Err<string, Error> {
		const charStr = String.fromCharCode(char);
		return nErr(
			new Error(
				`Aero error: the character, ${charStr}, is missing from the lookup table but is in the checks. This is not your fault; it is aero's, which is precisely where it checks to see if it is a valid URL character.`
			)
		);
	}
	/**
	 * Creates a `Neverthrow` Error when a character is not in the lookup table.
	 * This is a helper method meant to be for internal-use only, but it is exposed just in case you want to use it for whatever reason.
	 * @param char The character that is not in the lookup table
	 * @returns The properly formatted Neverthrow Error
	 */
	fmtErrNotInLookupTable(char: number): Err<string, Error> {
		const charStr = String.fromCharCode(char);
		return nErr(
			new Error(
				`User error: the character you provided, ${charStr}, is not in the lookup table. Perhaps it is not a valid URL character.`
			)
		);
	}
}
