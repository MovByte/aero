/**
 * These types are ported from @see https://github.com/web-platform-tests/wpt.fyi/blob/main/shared/run_diff.go and @see https://github.com/web-platform-tests/wpt.fyi/blob/main/shared/models.go
 */

/**
 * @see https://github.com/web-platform-tests/wpt.fyi/blob/a491f1165498e299006d5388bb0e4e8971900cc8/shared/models.go#L16-L22
 * Product uniquely defines a browser version, running on an OS version.
 * This type isn't used directly by the WPT-diff tests, but it is included if you need to use it for whatever reason.
 */
export interface Product {
	browser_name: string;
	browser_version: string;
	os_name: string;
	os_version: string;
}
/**
 * @see https://github.com/web-platform-tests/wpt.fyi/blob/a491f1165498e299006d5388bb0e4e8971900cc8/shared/models.go#L73
 * ProductAtRevision defines a WPT run for a specific product, at a specific hash of the WPT repo.
 * This type isn't used directly by the WPT-diff tests, but it is included if you need to use it for whatever reason.
 */
export interface ProductAtRevision {
	/**
	 * The first 10 characters of the SHA1 of the tested WPT revision.
	 * @deprecated The authoritative git revision indicator is `full_revision_hash`.
	 */
	revision: string;

	/**
	 * The complete SHA1 hash of the tested WPT revision.
	 */
	full_revision_hash: string;
}
/**
 * @see https://github.com/web-platform-tests/wpt.fyi/blob/a491f1165498e299006d5388bb0e4e8971900cc8/shared/models.go#L89-L113
 */
export interface TestRun {
	id: number;
	/**
	 * URL for summary of results, which is derived from raw results.
	 */
	results_url: string;
	/**
	 * Time when the test run metadata was first created.
	 */
	created_at: string;
	/**
	 * Time when the test run started.
	 */
	time_start: string;
	/**
	 * Time when the test run ended.
	 */
	time_end: string;
	/**
	 * URL for raw results JSON object. Resembles the JSON output of the wpt report tool.
	 */
	raw_results_url: string;
	/**
	 * Labels for the test run.
	 */
	labels: string[];
}
/**
 * Represents the types of changed test paths to include.
 * @see https://github.com/web-platform-tests/wpt.fyi/blob/a491f1165498e299006d5388bb0e4e8971900cc8/shared/params.go#L358-L375
 */
export interface DiffFilterParam {
	/**
	 * Added tests are present in the 'after' state of the diff, but not present in the 'before' state of the diff.
	 */
	added: boolean;
	/**
	 * Deleted tests are present in the 'before' state of the diff, but not present in the 'after' state of the diff.
	 */
	deleted: boolean;
	/**
	 * Changed tests are present in both the 'before' and 'after' states of the diff, but the number of passes, failures, or total tests has changed.
	 */
	changed: boolean;
	/**
	 * Unchanged tests are present in both the 'before' and 'after' states of the diff, and the number of passes, failures, or total tests is unchanged.
	 */
	unchanged: boolean;
}


/**
 * @see https://github.com/web-platform-tests/wpt.fyi/blob/a491f1165498e299006d5388bb0e4e8971900cc8/shared/run_diff.go#L87-L98
 * RunDiff represents a summary of the differences between 2 runs.
 */
export interface RunDiff {
	before: TestRun;
	beforeSummary: ResultsSummary;
	after: TestRun;
	afterSummary: ResultsSummary;
	differences: ResultsDiff;
	renames?: { [key: string]: string };
}

/**
 * @see https://github.com/web-platform-tests/wpt.fyi/blob/a491f1165498e299006d5388bb0e4e8971900cc8/shared/run_diff.go#L100-L101
 * TestSummary is a pair of [passing, total] counts for a test file.
 * This type isn't used directly by the WPT-diff tests, but it is included if you need to use it for whatever reason.
 */
export type TestSummary = [number, number];
/**
 * @see https://github.com/web-platform-tests/wpt.fyi/blob/a491f1165498e299006d5388bb0e4e8971900cc8/shared/run_diff.go#L110-L111
 * ResultsSummary is a collection of [pass, total] summary pairs, keyed by test.
 * This type isn't used directly by the WPT-diff tests, but it is included if you need to use it for whatever reason.
 */
export type ResultsSummary = { [key: string]: TestSummary };

/**
 * @see https://github.com/web-platform-tests/wpt.fyi/blob/a491f1165498e299006d5388bb0e4e8971900cc8/shared/run_diff.go#L121-L122
 * TestDiff is an array of differences between 2 tests.
 * This type isn't used directly by the WPT-diff tests, but it is included if you need to use it for whatever reason.
 */
export type TestDiff = number[];

/**
 * ResultsDiff is a collection of test diffs, keyed by the test path.
 * @see https://github.com/web-platform-tests/wpt.fyi/blob/a491f1165498e299006d5388bb0e4e8971900cc8/shared/run_diff.go#L248-L249
 * This type isn't used directly by the WPT-diff tests, but it is included if you need to use it for whatever reason.
 */
export type ResultsDiff = { [key: string]: TestDiff };