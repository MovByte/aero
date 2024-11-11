/**
 * @module
 * This script is used to sync the keywords and description in the package.json with the topics in the GitHub repository and format the package.json with Biome
 * TODO: Make a workflow that updates the keywords whenever they are changed (check every week) that would use this script
 */

// This is already defined in the global scope of Node, but not for Deno
import process from "node:process";

import Logger from "./src/AeroSandbox/build/Logger";

import { Octokit } from "octokit";

import packageJSON from "../package.json" with { type: "json" };

import { Biome, Distribution } from "@biomejs/js-api";

import { writeFile } from "node:fs/promises";

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import getGitHubURLSplit from "./shared/getGitHubURLSplit";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const verboseMode = process.env.VERBOSE === "true";

if (!("GITHUB_TOKEN" in process.env))
    throw new Error("No GitHub token found in the env variables. Exiting.");

const githubToken = process.env.GITHUB_TOKEN;

const ownerChosen = process.env.CUSTOM_OWNER;
const repoChosen = process.env.CUSTOM_REPO;

const logger = new Logger(verboseMode);

logger.log("Initializing the Octokit SDK later used for fetching the repository JSON");

const octokit = new Octokit({
    auth: githubToken
})

if (!("repository" in packageJSON))
    throw new Error("No repository field found in the package.json, required to get the URL field used to fetch the keywords");
if (!("url" in packageJSON.repository))
    throw new Error("No URL field found in the repository field of the package.json, required to fetch the keywords");

const githubURLSplitRes = getGitHubURLSplit(packageJSON.repository.url, logger.log);
if (githubURLSplitRes.isErr())
    throw new Error(`Failed to get the owner and repository name from the GitHub URL: ${githubURLSplitRes.error.message}`);
const [owner, repo] = githubURLSplitRes.value;

let repoJSON;
try {
    logger.log("Fetching the repository JSON through the SDK");

    repoJSON = await octokit.request('GET /repos/{owner}/{repo}', {
        owner: ownerChosen || owner,
        repo: repoChosen || repo,
        headers: {
            'X-GitHub-Api-Version': '2022-11-28'
        }
    })
} catch (err) {
    throw new Error(`Failed to fetch the repository JSON through the SDK: ${err.message}`);
}

if (!("data" in repoJSON))
    throw new Error("No data field found in the repository JSON, expected to find the field there" + (verboseMode ? `. The full repo in question for this error is: ${repoJSON}` : ""));
if (!("topics" in repoJSON.data))
    throw new Error("The topics field was not found in the repository JSON, expected to find the keywords there" + (verboseMode ? `. The full repo in question for this error is: ${repoJSON}` : ""));
if (!("description" in repoJSON.data))
    throw new Error("The description field was not found in the repository JSON, expected to find the description there" + (verboseMode ? `. The full repo in question for this error is: ${repoJSON}` : ""));

const newPackageJSONObj = {
    ...packageJSON,
    keywords: repoJSON.data.topics,
    description: repoJSON.data.description
};

logger.log("Stringifying the new package.json object:\n", newPackageJSONObj);

let newPackageJSON;
try {
    newPackageJSON = JSON.stringify(newPackageJSONObj);
} catch (err) {
    throw new Error(`Failed to stringify the new package.json object: ${err.message}`);
}

const packageJSONPath = resolve(__dirname, "../package.json");

logger.log(`Stringified the new package.json object. Now:\n${packageJSONPath}`);

let fmtNewPackageJSON;
try {
    const biome = await Biome.create({
        distribution: Distribution.NODE,
    });

    fmtNewPackageJSON = biome.formatContent(newPackageJSON, {
        filePath: "package.json"
    });
} catch (err) {
    throw new Error(`Failed to use Biome to format the new package.json object: ${err.message}`);
}

if (!("content" in fmtNewPackageJSON))
    throw new Error("No content field found in the formatted package.json object from BiomeJS, expected to find the field there");

logger.log(`Writing the new keywords and keywords to the package.json @ ${packageJSONPath}. Writing: \n${newPackageJSON}`);

try {
    writeFile("./package.json", fmtNewPackageJSON.content, {
        flag: "w",
    });
} catch (err) {
    throw new Error(`Failed to write the new keywords and description to the package.json @ ${packageJSONPath}: ${err.message}`);
}

console.info("Successfully updated the keywords and description in the package.json");

