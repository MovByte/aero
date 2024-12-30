import { type APIInterceptor } from "$types/apiInterceptors";

import { afterPrefix } from "$interceptorUtil/getProxyURL";

export default {
	proxyHandler: {
		construct(target, args) {
			const [callback] = args;
			args[1] = async (reports) => {
				reports = await rewriteReports(reports);

				callback(...arguments);
			};

			const ret = Reflect.construct(target, args);
			ret.takeRecords = new Proxy(ret.takeRecords, {
				async apply(target, that, args) {
					return await rewriteReports(Reflect.apply(target, that, args));
				},
			});
		},
	},
	conceals: {
		targeting: "CONSTRUCTOR_PARAM",
		targetingParam: 2,
	},
	// TODO: conceals prop
	globalProp: "ReportingObserver",
} as APIInterceptor;

async function rewriteReports(reports) {
	for (let report of reports) {
		// https://w3c.github.io/reporting/#serialize-reports
		const json = report.toJSON();
		report.toJSON = () => ({
			...json,
			url: afterPrefix(json.url),
		});

		// TODO: Find @types for this
		if (report instanceof CSPViolationReportBody) {
			// Urls
			report.blockedURL = Object.defineProperty(report, "blockedURL", {
				value: afterPrefix(report.blockedURL),
				writable: false,
			});
			report.documentURL = Object.defineProperty(report, "documentURL", {
				value: afterPrefix(report.documentURL),
				writable: false,
			});
			report.referrer = Object.defineProperty(report, "referrer", {
				value: afterPrefix(report.referrer),
				writable: false,
			});
			report.sourceFile = Object.defineProperty(report, "sourceFile", {
				value: afterPrefix(report.sourceFile),
				writable: false,
			});

			// Don't reveal the rewritten script
			const resp = await fetch(report.sourceFile);
			const respTxt = await resp.text();
			report.sample = (respTxt).slice(
				0,
				respTxt.length
			);

			// TODO: Finish rewriting more properties
		}

		// Error location
		report.sourceFile = afterPrefix(report.sourceFile);
		// TODO: Get the column number from the line in the original script (through .lineNumber)
		report.columnNumber = null;
	}
	return reports;
}