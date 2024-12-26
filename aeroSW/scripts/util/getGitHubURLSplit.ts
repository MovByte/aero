import type { Result } from "neverthrow";
import { ok as nOk, err as nErr } from "neverthrow";

// TODO: Document with JSDoc
export default function getGitHubURLSplit(githubURL: string, logger?: Function): Result<string[], Error> {
	let githubRepo: URL;
	try {
		if (logger)
			logger("Parsing the repository URL");

		githubRepo = new URL(githubURL);
	} catch (err) {
		return nErr(new Error(err instanceof TypeError ? `Failed to parse the repository URL: ${err.message}` : `Unexpected error occured while parsing the repository URL: ${err.message}`));
	}

	if (logger)
		logger("Getting the owner and repository name from the URL");

	const [owner, repoRaw] = githubRepo.pathname.split("/").slice(1);
	const repoSplit = repoRaw.split(".git");
	if (repoSplit.at(-1) !== "")
		return nErr(new Error("Invalid format for the GitHub repository URL, expected a .git at the end of the URL"));
	if (repoSplit.length !== 2)
		return nErr(new Error("Unexpected double split of \".git\" in the owner field of the repository URL"));
	const repo = repoSplit[0];

	return nOk([owner, repo]);
}