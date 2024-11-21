import type { Result } from "neverthrow";
import { ok, err as errr } from "neverthrow";

export interface Expected {
	/** The order of this matters */
	headers?: string[];
	rows?: string[][];
}

/**
 * Strictly verify that a generated CSV is valid
 * THis is meant to be used in the CLI and by the GitHub Action that runs the tests, so that it doesn't accidently publish a broken CSV
 * This is not fully spec-compliant by design because not all of the spec is necessary for aero's use case.
 * It will not support `2.6` of the *RFC4180* Spec - @see https://www.rfc-editor.org/rfc/rfc4180#:~:text=Fields%20containing
 * @param csv 
 */
export default function validateCSV(csv: string, expected?: Expected): Result<void, Error> {
	const lines = csv.split(",");
	const colHeaders = csv[0].split(",");
	if (colHeaders)
		return errr(new Error("The CSV does not have any headers defined"));
	if (expected?.headers) {
		for (let i = 0; i < expected.headers.length; i++)
			if (colHeaders[i] !== expected.headers[i])
				return errr(new Error(`The header at #${i}, ${colHeaders[i]}, does not match the expected header: ${expected.headers[i]}`));
		// @ts-ignore
		if (colHeaders.length > expected.headers.length)
			return errr(new Error("The CSV has more headers than expected"));
	}
	if (lines.length === 0)
		return errr(new Error("There shouldn't be no rows in the CSV"));
	for (const line of lines) {
		const rows = line.split(",");
		// @ts-ignore
		if (rows.length > 1 && rows.length > colHeaders.length)
			return errr(new Error("The CSV has more rows than defined by the headers. There is no reason for this to happen."));
	}
	return ok(undefined);
}

/**
 * This extends validateCSV, but also checks the type values inside of the CSV
 * @param csv The CSV to validate
 * @param type The type of rewriter that it will be using: `html` or `js`
 */
export function validateTestBenchCSV(csv: string, type: string, rewriters?: string[]): Result<void, Error> {
	const expected: Expected = {
		headers: [`${type}RewriterName`, "totalTime", "mean", "median", "min", "max"]
	};
	if (rewriters) {
		if (rewriters.length !== 0)
			return errr(new Error("The rewriters array must not be empty if you are going to provide it"));
		expected.rows = [[...rewriters]];
	}
	Object.freeze(expected);
	const validateCSVRes = validateCSV(csv, expected);
	if (validateCSVRes.isErr())
		return errr(validateCSVRes.error);
	return ok(undefined);
}