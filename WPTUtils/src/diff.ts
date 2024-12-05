/**
 * @module
 *  This code is a TS implementation based on wpt.fyi's diff endpoint `/api/diff`, but it allows us to run our own diffs of runs @see https://github.com/web-platform-tests/wpt.fyi/blob/main/shared/run_diff.go
 */

import type { ResultAsync } from "neverthrow";
import { okAsync } from "neverthrow";
import { fmtNeverthrowErr } from "./util/fmtErr";

import type { DiffFilterParam, ResultsSummary, RunDiff, TestDiff, ResultsDiff } from "$types/diff.d.ts";

const apiBase = "https://wpt.fyi/api/";

/**
 * This method wraps `getResultsDiff` and returns a `RunDiff` object after diffing with the after being an official test run given by URL Search Params for getting the official test run from the wpt.fyi API.
 * @param results The results `before`. This is passed into directly into `getResultsDiff`.
 * @param getBrowserRunParams The parameters for fetching the official test run from the wpt.fyi API
 * @returns The diff
 */
export default async function runDiffWithOfficialTestRun(results: ResultsSummary, getBrowserRunParams: URLSearchParams): Promise<ResultAsync<Partial<RunDiff>, Error>> {
	const testRunURL = new URL(`${apiBase}runs`);
	const resultsURL = new URL(`${apiBase}results`);
	for (const [key, value] of getBrowserRunParams.entries()) {
		testRunURL.searchParams.append(key, value);
		testRunURL.searchParams.append(key, value);
	}

	let compRunResp: Response;
	try {
		compRunResp = await fetch(testRunURL);
	} catch (err) {
		return fmtNeverthrowErr("Failed to fetch the official test run for the browser matching with ...", err.message);
	}
	const compRun = await compRunResp.json();

	resultsURL.searchParams.append("run_id", compRun.id);
	const compResultResp = await fetch(resultsURL);
	const compResults = await compResultResp.json();

	return okAsync(getRunsDiffJSON(results, compResults.results, { added: true, changed: true, deleted: true, unchanged: false }));
}

/**
 * This method is modified from the original in that you must pass in the `before` and `after` JSON objects directly and you don't get a the TestRun information on the `RunDiff` object. It also removes features locked behind feature flags that aren't needed for the WPT-Diff tests. @see https://github.com/web-platform-tests/wpt.fyi/blob/a491f1165498e299006d5388bb0e4e8971900cc8/shared/run_diff.go#L348-L380
 */
function getRunsDiffJSON(beforeSummary: ResultsSummary, afterSummary: ResultsSummary, filter: DiffFilterParam): Partial<RunDiff> {
	return {
		beforeSummary,
		afterSummary,
		differences: getResultsDiff(beforeSummary, afterSummary, filter),
	};
}

/**
 * @returns a map of test name to an array of `[newly-passing, newly-failing, total-delta]`, for tests which had different results counts in their map (which is test name to array of `[count-passed, total])`.
 * This method is ported from @see https://github.com/web-platform-tests/wpt.fyi/blob/a491f1165498e299006d5388bb0e4e8971900cc8/shared/run_diff.go#L449-L503
 * This is a helper function meant to be for internal-use only, but it is exposed just in case you want to use it for whatever reason.
 */
export function getResultsDiff(
	before: ResultsSummary,
	after: ResultsSummary,
	filter: DiffFilterParam,
	paths?: Set<string>,
	renames?: { [key: string]: string }
): ResultsDiff {
	const diff: ResultsDiff = {};
	if (filter.deleted || filter.changed) {
		for (const [test, resultsBefore] of Object.entries(before)) {
			let testPath = test;
			if (renames?.[test])
				testPath = renames[test];
			if (!anyPathMatches(testPath, paths))
				continue;
			const testDiff = newTestDiff(
				filter,
				resultsBefore,
				after[testPath]
			);
			if (testDiff)
				diff[testPath] = testDiff;
		}
	}
	if (filter.added) {
		for (const [test, resultsAfter] of Object.entries(after)) {
			// Skip `added` results of a renamed file (handled above).
			if (renames && Object.values(renames).includes(test))
				continue;
			// If it was in the before set, it's already been computed.
			if (before[test] || !paths || !anyPathMatches(test, paths))
				continue;
			const testDiff = newTestDiff(
				filter,
				undefined,
				resultsAfter
			);
			if (testDiff)
				diff[test] = testDiff;
		}
	}
	return diff;
}

/** 
 * Computes the differences between two test-run pass-count summaries, namely an array of `[passing, total]` counts.
 * The order of the parameters had to be changed from the original Go method because there shouldn't be an optional after a required parameter.
 * This method is ported from @see https://github.com/web-platform-tests/wpt.fyi/blob/a491f1165498e299006d5388bb0e4e8971900cc8/shared/run_diff.go#L202-L246									
 */
function newTestDiff(
	filter: DiffFilterParam,
	before?: number[],
	after?: number[],
): TestDiff | null {
	if (!before) {
		if (!after || !filter.added)
			return null;
		return [
			after[0],
			after[1] - after[0],
			after[1]
		];
	}
	if (!after) {
		// NOTE(lukebjerring): Missing tests are only counted towards changes in the total.
		if (!filter.deleted)
			return null;
		return [
			0,
			0,
			-before[1]
		] as TestDiff;
	}

	const delta = before[0] - after[0]
	const changed = delta !== 0 || before[1] !== after[1];

	if ((!changed && !filter.unchanged) || (changed && !filter.changed))
		return null;

	const improved = Math.max(0, after[0] - before[0]);
	const failingBefore = before[1] - before[0];
	const failingAfter = after[1] - after[0];
	const regressed = Math.max(0, failingAfter - failingBefore);

	/** Changed tests is at most the number of different outcomes, but newly introduced tests should still be counted (e.g. `0/2` => `0/5` */
	return [
		improved,
		regressed,
		after[1] - before[1],
	];
}


/**
 * The order of the parameters had to be changed from the original Go method because there shouldn't be an optional after a required parameter.
 * Based on @see https://github.com/web-platform-tests/wpt.fyi/blob/a491f1165498e299006d5388bb0e4e8971900cc8/shared/run_diff.go#L539-L549
 */
function anyPathMatches(testPath: string, paths?: Set<string>): boolean {
	if (!paths)
		return true;
	for (const path of paths)
		if (testPath.startsWith(path))
			return true;
	return false;
}