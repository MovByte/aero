import {
	getPropOnProxyNamespace,
	getPropOnAeroSandboxNamespace
} from "./getPropFromTree";

export function getProxyConfig() {
	return getPropOnProxyNamespace(CONFIG_KEY);
}

/** Get the config for AeroSandbox */
export default function getConfig() {
	return getPropOnAeroSandboxNamespace(CONFIG_KEY);
}
