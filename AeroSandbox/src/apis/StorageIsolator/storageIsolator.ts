import contextualIdentities from "./contextualIdentities";

export default {
	contextualIdentities,
	proxifiedAPIs: {
		localStorage: () => (),
		sessionStorage
	}
};

// FORGET ALL OF THIS SIMPLY MAKE IT AN SDK FOR THE SW BACKEND APIS
/*
function getStorageIsolatorKeys(getActive = true) {
// TODO: In the backend this will call 
}

export default storageIsolator(affectedApis: StorageIsolationOptions) {

}

export { getStorageIsolatorKeys };
*/

// TODO: Make return an object which has a proxified version of every web storage API
