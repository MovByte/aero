export default function getPropFromTree(propTree: string) {}

export function getPropOnProxyNamespace(propTree: string) {
	return getPropFromTree(`${PROXY_NAMESPACE}.${propTree}`);
}

export function getPropOnAeroSandboxNamespace(propTree: string) {
	return getPropFromTree(`${OUR_NAMESPACE}.${propTree}`);
}
