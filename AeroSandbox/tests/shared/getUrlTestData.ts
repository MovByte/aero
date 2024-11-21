import type { ResultAsync } from "neverthrow";
import { okAsync, errAsync as nErrAsync } from "neverthrow";

interface UrlTests {
	input: string,
	base: null,
	href: string,
	origin: string,
	protocol: string,
	username: string,
	password: string,
	host: string,
	hostname: string,
	port: string,
	pathname: string,
	search: string,
	hash: string
}

/**
 * Fetches the test URLs from the WPT URL test data
 * @returns The test URLs wrapped behind a `ResultAsync` object from *Neverthrow*
 * @see https://wpt.live/url/README.md
 */
export default async function getUrlTestData(jsSafe = true): Promise<ResultAsync<string[], Error>> {
	try {
		const urlTestDataResp = await fetch(jsSafe ? "https://wpt.live/url/resources/urltestdata-javascript-only.json" :
			"https://wpt.live/url/resources/urltestdata.json");
		const urlTestData: UrlTests[] = await urlTestDataResp.json();
		return okAsync(["https://example.com"]);
		//return okAsync(urlTestData.map((urlTests: UrlTests) => urlTests.input));
	} catch (err: any) {
		return nErrAsync(new Error(`Failed to fetch the test URLs from urltestdata.json from WPT: ${err.message}`));
	}
}