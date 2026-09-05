import { readFile } from 'node:fs/promises';
import { analyze } from './analysis.mjs';
import { pullRequestForWorkflowRun, workflowRunHeadSha } from './event.mjs';
import { collectReviewInput } from './inputs.mjs';
import { renderComment } from './reporting.mjs';

const event = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, 'utf8'));
const headSha = workflowRunHeadSha(event);
const githubHeaders = {
  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  Accept: 'application/vnd.github+json',
};
const pullRequestsUrl = `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/commits/${encodeURIComponent(headSha)}/pulls?per_page=100`;
const pullRequestsResponse = await fetch(pullRequestsUrl, {
  headers: githubHeaders,
});
if (!pullRequestsResponse.ok)
  throw new Error(
    `Unable to retrieve pull requests for completed workflow (${pullRequestsResponse.status}).`
  );
const pullRequest = pullRequestForWorkflowRun(await pullRequestsResponse.json(), headSha);
if (!pullRequest) process.exit(0);
const filesUrl = `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/pulls/${pullRequest.number}/files?per_page=100`;
const filesResponse = await fetch(filesUrl, { headers: githubHeaders });
if (!filesResponse.ok)
  throw new Error(`Unable to retrieve pull request files (${filesResponse.status}).`);
const input = await collectReviewInput({
  pull_request: pullRequest,
  files: await filesResponse.json(),
});
if (!input) process.exit(0);
const analysis = await analyze(input, process.env.MISTRAL_API_KEY);
const body = renderComment(analysis, input.pullRequest.headSha);
const api = `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/issues/${input.pullRequest.number}/comments`;
const headers = { ...githubHeaders, 'Content-Type': 'application/json' };
const comments = await fetch(api, { headers }).then((response) =>
  response.ok ? response.json() : []
);
const existing = comments.find(
  (comment) =>
    comment.user?.login === 'github-actions[bot]' &&
    comment.body?.includes('<!-- dependabot-intelligent-review -->')
);
await fetch(existing ? `${api}/${existing.id}` : api, {
  method: existing ? 'PATCH' : 'POST',
  headers,
  body: JSON.stringify({ body }),
});
