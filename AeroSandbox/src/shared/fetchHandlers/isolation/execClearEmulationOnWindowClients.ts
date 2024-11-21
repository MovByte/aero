const clearCache = async (clear: string[], proxyUrl: URL): Promise<void> => {
	if (clear.includes("'*'") || clear.includes("'cache'"))
		await caches.delete(proxyUrl.origin);
};

const clearExecutionContexts = async (
	clear: string[],
	client: Client,
	proxyUrl: URL
): Promise<void> => {
	if (clear.includes("'*'") || clear.includes("executionContexts")) {
		const clientOrigin = new URL(
			client.url.replace(new RegExp(`^(${self.config.prefix})`, "g"), "")
		).origin;
		if (clientOrigin === proxyUrl.origin)
			client.postMessage("clearExecutionContext");
	}
};

export default async (
	clear: string[],
	client: Client,
	proxyUrl: URL
): Promise<void> => {
	await clearCache(clear, proxyUrl);
	await clearExecutionContexts(clear, client, proxyUrl);
};
