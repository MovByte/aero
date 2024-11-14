/**
 * @module
 * This module is responsible for emulating HSTS cache behavior using emulation and IndexedDB
 *
 * @example
 */

import { ResultAsync, okAsync, errAsync as errrAsync } from "neverthrow";
import type { Nullable } from 'option-t/nullable';

import Cache from "./Cache";

// Error strings
const unexpectedPromiseResRetErrorExplanation = " Something other than \"success\" or Error was returned.";
const processHSTSAction = "process the HTTP header for HSTS";
// Error string templates
// TODO: Make a separate module for these
function failedToFormVar(variableName: string, variableType: string): string {
	return failedToGeneric("create/form", variableName, variableType);
}
function failedToDeleteVar(variableName: string): string {
	return failedToGeneric("delete", variableName);
}
function failedToGeneric(action: string, variableName: string, variableType?: string): string {
	return `Failed to ${action} the ${variableName} variable ${variableType ? `(${variableType}) ` : ""}when trying to`;
}

// TODO: Put the internal-use (recommended?) methods on the bottom
/**
 * Class for emulating HSTS cache behavior using IndexedDB.
 *
 * @extends {Cache}
 *
 * @example
 * ...
 * const hstsCacheEmulator = new HSTSCacheEmulation(
 *  rewrittenReqHeaders.get("strict-transport-security"),
	proxyUrl.origin
 * );
 */
export default class HSTSCacheEmulation extends Cache {
	/**
	 * The hostname of the proxy server.
	 *
	 * @member
	 */
	proxyHostname: string;

	/**
	 * Constructs a new HSTSCacheEmulation instance.
	 *
	 * @param hsts - The HSTS header value.
	 * @param proxyHostname - The hostname of the proxy server.
	 */
	constructor(hsts: string, proxyHostname: string) {
		super();
		this.proxyHostname = proxyHostname;

		if (hsts)
			this.processHSTS(hsts);
	}

	/**
	 * Processes the HSTS header and stores the relevant information in IndexedDB.
	 *
	 * @param hsts - The HSTS header value.
	 * @returns
	 *
	 * @example
	 * TODO:...
	 */
	async processHSTS(hsts: string): Promise<ResultAsync<void, Error>> {
		let directives: string[];
		try {
			directives = hsts.toLowerCase().split(";");
		} catch (err) {
			return errrAsync(new Error(`${failedToFormVar("directives", "string array")} ${processHSTSAction}${ERROR_LOG_AFTER_COLON}${err.message} `));
		}

		let includeSubdomains: boolean;
		try {
			const includeSubdomainsDirective = directives.find(
				dir => dir === "includeSubdomain"
			);
			includeSubdomains = includeSubdomainsDirective !== undefined;
		} catch (err) {
			return errrAsync(new Error(`${failedToFormVar("includeSubdomains", "boolean")} ${processHSTSAction}${ERROR_LOG_AFTER_COLON}${err.message}`));
		}

		let maxAge: string;
		try {
			const maxAgeDirective = directives.find(dir =>
				dir.startsWith("max-age")
			);
			const maxAge = maxAgeDirective?.split("=")?.[1];
		}
		catch (err) {
			return errrAsync(new Error(`${failedToFormVar("maxAge", "string")} ${processHSTSAction}${ERROR_LOG_AFTER_COLON}${err.message} `));
		}

		if (maxAge === "0") {
			const deleteEntryRes = await this.deleteEntry();
			if (deleteEntryRes.isErr())
				return errrAsync(new Error(`Failed to delete the entry when trying to ${processHSTSAction}${ERROR_LOG_AFTER_COLON}${deleteEntryRes.error.message} `));
		} else if (maxAge) {
			const storeEntryRes = await this.storeEntry(maxAge, includeSubdomains);
			if (storeEntryRes.isErr())
				return errrAsync(new Error(`Failed to store the entry when trying to ${processHSTSAction}${ERROR_LOG_AFTER_COLON}${storeEntryRes.error.message} `));
		}

		return okAsync(undefined);
	}

	/**
	 * Redirects to HTTPS if an HSTS entry exists for the given hostname or its subdomains.
	 *
	 * @returns - Whether a redirect should be performed.
	 *
	 * @example
	 * const redirectRes = await hstsCacheEmulator.redirect();
	 * if (redirectRes.isErr()) {
	 *  const redirectResErr = new Error(`Failed to determine if the client should redirect when using the cache emulator${ERROR_LOG_AFTER_COLON}${redirectRes.error.message}`)
	 *  ...(handle the error accordingly)
	 * } else {
	 * ...(your logic to redirect to the HTTPS version of your proxy URL)
	 * }
	 */
	async redirect(): Promise<ResultAsync<boolean, Error>> {
		try {
			const domains = this.proxyHostname.split(".");
			for (let i = domains.length - 1; i >= 1; i--) {
				const domain = domains.slice(i).join(".");
				const secRes = await this.getEntry(domain);
				if (secRes.isErr())
					return errrAsync(new Error(`Failed to get the entry for the domain, ${domain}, while trying to determine if the redirect to HTTPS should be done${ERROR_LOG_AFTER_COLON}${err.message} `))
				// TODO: Use Zod instead and have getEntry fail if it isn't validated properly instead of having to check externally like here for Runtime type checking for `secRes.value.result...` (validation)
				if (typeof secRes.value?.result?.subdomains === "undefined")
					return errrAsync(new Error("The entry for the domain, ${domain}, does not have the subdomains field defined"));
				if (typeof secRes.value?.result?.age === "undefined")
					return errrAsync(new Error("The entry for the domain, ${domain}, does not have the age field defined"));
				if (typeof secRes.value.result.subdomains === "boolean" && secRes.value.result.subdomains === true)
					return okAsync(secRes.value.result.subdomains && super.isFresh(secRes.value.result?.age));
			}
			const sec = await this.getEntry(this.proxyHostname);
			return okAsync(super.isFresh(sec?.result?.age));
		} catch (err) {
			return errrAsync(new Error(`Failed to determine if the redirect to HTTPS should be done${ERROR_LOG_AFTER_COLON}${err.message} `));
		}
	}

	/**
	 * Deletes the HSTS entry for the given hostname.
	 * This is meant to be for internal use only, but it is exposed just in case you want to use it for whatever reason.
	 *
	 * @returns
	 *
	 * @example
	 * await this.deleteEntry();
	 */
	async deleteEntry(): Promise<ResultAsync<void, Error>> {
		// FIXME: THIS IS WRITTEN WRONG
		const deleteRes = await new Promise<"success" | Error>((resolve, reject) => {
			const idbReq = indexedDB.deleteDatabase(this.proxyHostname);
			idbReq.onsuccess = (): void => resolve("success");
			idbReq.onerror = (): void => reject(idbReq.error);
		});
		if (deleteRes instanceof Error)
			return errrAsync(new Error(`Failed to delete the HSTS entry ${this.proxyHostname}${ERROR_LOG_AFTER_COLON}${deleteRes.message} `));
		if (deleteRes === "success")
			return okAsync(undefined);
		return errrAsync(new Error(`Failed to determine if the attempt to delete the HSTS entry was successful.${unexpectedPromiseResRetErrorExplanation} `));
	}

	/**
	 * Stores an HSTS entry in IndexedDB.
	 * This is meant to be for internal use only, but it is exposed just in case you want to use it for whatever reason.
	 *
	 * @param age The max-age value of the HSTS header.
	 * @param includeSubdomains Whether the HSTS header includes subdomains.
	 * @returns
	 *
	 * @example
	 * // See the processHSTS method for an example of how to use this method. It reveals how I define the maxAge and includeSubdomains variables.
	 * await this.storeEntry(maxAge, includeSubdomains);
	 */
	async storeEntry(age: string, includeSubdomains: boolean): Promise<ResultAsync<void, Error>> {
		const dbRes = await this.safeOpenDatabase();
		if (dbRes.isErr())
			return errrAsync(new Error(`Failed to open the IndexedDB database used for storing the HSTS entry${ERROR_LOG_AFTER_COLON}${dbRes.error.message} `))
		const db = dbRes.value;

		let tx: IDBTransaction;
		let store: IDBObjectStore;
		try {
			tx = db.transaction(this.proxyHostname, "readwrite");
			store = tx.objectStore(this.proxyHostname);
		} catch (err) {
			return errrAsync(new Error(`Failed get the store for the HSTS entry${ERROR_LOG_AFTER_COLON}${err.message} `));
		}

		const idbReqPromise = await new Promise<"success" | Error>((reject, resolve) => {
			const idbReq = store.put({
				age: age,
				subdomains: includeSubdomains
			});
			idbReq.onsuccess = (): void => resolve("success");
			idbReq.onerror = (): void => reject(idbReq.error);
		});
		if (idbReqPromise instanceof Error)
			return errrAsync(new Error(`Failed to store the HSTS entry${ERROR_LOG_AFTER_COLON}${idbReqPromise.message} `));

		const firstPromise = await Promise.race([
			new Promise<"success" | Error>((reject, resolve) => {
				tx.oncomplete = (): void => {
					db.close();
					resolve("success");
				}
				tx.onerror = (): void => reject(tx.error);
			}),
			new Promise<{
				type: "timeout"
			}>((reject) => {
				setTimeout(() => reject({
					type: "timeout"
				}), aeroConfig.dbTransactionTimeout);
			})
		]);
		// @ts-ignore: We know they have overlap
		if (firstPromise === {
			type: "timeout"
		})
			return errrAsync(new Error("The transaction used for storing the HSTS entry unexpectedly timed out"));
		if (firstPromise instanceof Error)
			return errrAsync(new Error(`Failed to close the transaction used for storing the HSTS entry${ERROR_LOG_AFTER_COLON}${err.message} `));
		if (firstPromise === "success")
			return okAsync(undefined);
		return errrAsync(new Error(`Failed to determine if the attempt to store the HSTS entry was successful.${unexpectedPromiseResRetErrorExplanation} `));
	}

	/**
	 * Retrieves an HSTS entry from IndexedDB.
	 *
	 * @param hostname - The hostname to retrieve the entry for.
	 * @returns
	 */
	async getEntry(hostname: string): Promise<ResultAsync<Nullable<IDBRequest<any>>, Error>> {
		// FIXME: This error catching and req stuff is wrong
		let hostnameStore: IDBObjectStore;
		try {
			const db = await this.safeOpenDatabase();
			const tx = db.transaction(hostname, "readwrite");
			const store = tx.objectStore(hostname);
			const hostnameStore = store.get(hostname);
		} catch (err) {
			return errrAsync(new Error(`Failed to get the object store for the hostname used for getting entries${ERROR_LOG_AFTER_COLON}${err.message} `));
		}

		return okAsync(hostnameStore);
	}

	/**
	 * A safe and modernized abstraction for opening the IndexedDB database we need for HSTSCacheEmulation.
	 * This is a helper function meant to be for internal-use only, but it is exposed just in case you want to use it for whatever reason.
	 *
	 * @returns
	 *
	 * @example
	 * const dbRes = await this.safeOpenDatabase();
	 * if (dbRes.isErr())
	 *   ...(abort)
	 * const db = dbRes.value;
	 */
	async safeOpenDatabase(): Promise<ResultAsync<IDBDatabase, Error>> {
		try {
			const db = await new Promise<IDBDatabase>((resolve, reject) => {
				const req = indexedDB.open("sts");
				req.onsuccess = (): void => resolve(req.result);
				req.onerror = (): void => reject(req.error);
			});
			return okAsync(db);
		} catch (err) {
			return errrAsync(new Error(`Failed to open the IndexedDB database${ERROR_LOG_AFTER_COLON}${err.message} `));
		}
	}
}
