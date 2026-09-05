import { readFile } from 'node:fs/promises';
import { analyze } from './analysis.mjs';
import { pullRequestNumber } from './event.mjs';
import { upsertComment } from './github.mjs';
import { collectReviewInput } from './inputs.mjs';
import { renderComment } from './reporting.mjs';

const eventPath = process.env.GITHUB_EVENT_PATH;
if (!eventPath) throw new Error('GITHUB_EVENT_PATH is required.');
// oxlint-disable-next-line security/detect-non-literal-fs-filename -- GitHub Actions supplies this runner path.
const event = JSON.parse(await readFile(eventPath, 'utf8'));
const githubHeaders = {
  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  Accept: 'application/vnd.github+json',
};
const number = await pullRequestNumber(event, {
  repository: process.env.GITHUB_REPOSITORY,
  githubHeaders,
});
const pullRequestApi = `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/pulls/${number}`;
const [pullRequestResponse, filesResponse] = await Promise.all([
  fetch(pullRequestApi, { headers: githubHeaders }),
  fetch(`${pullRequestApi}/files?per_page=100`, { headers: githubHeaders }),
]);
if (!pullRequestResponse.ok)
  throw new Error(`Unable to retrieve pull request (${pullRequestResponse.status}).`);
if (!filesResponse.ok)
  throw new Error(`Unable to retrieve pull request files (${filesResponse.status}).`);
const input = await collectReviewInput(
  {
    pull_request: await pullRequestResponse.json(),
    repository: process.env.GITHUB_REPOSITORY,
    files: await filesResponse.json(),
  },
  { githubHeaders }
);
if (!input) process.exit(0);
const analysis = await analyze(input, process.env.MISTRAL_API_KEY);
const body = renderComment(analysis, input.pullRequest.headSha);
await upsertComment({
  api: `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/issues/${input.pullRequest.number}/comments`,
  body,
  headers: githubHeaders,
});
