import { afterPrefix } from "$interceptorUtil/getProxyURL";

// TODO: Define the undefined APIs on the Window object. This file is very incomplete.

// Only supported on chromium
/*
if ("ReportingObserver" in window) {
  async function rewriteReports(reports) {
	for (let report of reports) {
	  // https://w3c.github.io/reporting/#serialize-reports
	  const json = report.toJSON();
	  report.toJSON = () => ({
				..on,
		url: afterPrefix(json.url),
	  });

	  if (report instanceof CSPViolationReportBody) {
		// Urls
		CSPViolationReportBody.blockedURL = afterPrefix(
		  CSPViolationReportBody.blockedURL
		);
		CSPViolationReportBody.referrer = afterPrefix(
		  CSPViolationReportBody.referrer
		);
		CSPViolationReportBody.sourceFile = afterPrefix(
		  CSPViolationReportBody.sourceFile
		);

		// Don't reveal the rewritten script
		const resp = await fetch(CSPViolationReportBody.sourceFile);
		CSPViolationReportBody.sample = (await resp.text()).slice(
		  0,
		  resp.length
		);
	  }

	  // Error location
	  report.sourceFile = afterPrefix(report.sourceFile);
	  // TODO: Get the column number from the line in the original script (through .lineNumber)
	  report.columnNumber = null;
	}
	return reports;
  }

  ReportingObserver = new Proxy(ReportingObserver, {
	construct(target, args) {
	  const [callback] = args;

	  args[1] = async (reports) => {
		reports = await rewriteReports(reports);

		callback(...arguments);
	  };

	  const ret = Reflect.construct(target, args);

	  ret.takeRecords = async () => rewriteReports(ret.takeRecords());
	},
  });
}
*/
