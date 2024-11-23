/**
 * This does the same thing as `integrity.val.ts`, but runs with modules
 */

export default (): {
	code: string;
} => {
	return {
		code: `
// FIXME: Breaks sites such as https://www.aquarium.ru/en and https://radon.games
const integrity = import.meta.url.searchParams.get("integrity");
if (integrity) await calc(integrity, body);
		`
	};
};
