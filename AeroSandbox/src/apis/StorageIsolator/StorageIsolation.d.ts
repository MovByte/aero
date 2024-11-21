type storageAPIs = "all" | "localStorage" | "sessionStorage";

interface StorageIsolationOptions {
	/* https://developers.google.com/privacy-sandbox/cookies/storage-access-api */
	allowStorageAccessAPI: boolean;
	apisToIsolate: storageAPIs[];
}
