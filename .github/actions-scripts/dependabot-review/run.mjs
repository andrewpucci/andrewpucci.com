import { readFile } from 'node:fs/promises';
import { analyze } from './analysis.mjs';
import { collectReviewInput } from './inputs.mjs';
import { renderComment } from './reporting.mjs';

const eventPath = process.env.GITHUB_EVENT_PATH;
if (!eventPath) throw new Error('GITHUB_EVENT_PATH is required.');
// oxlint-disable-next-line security/detect-non-literal-fs-filename -- GitHub Actions supplies this runner path.
const event = JSON.parse(await readFile(eventPath, 'utf8'));
const filesUrl = `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/pulls/${event.pull_request.number}/files?per_page=100`;
const githubHeaders = {
  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  Accept: 'application/vnd.github+json',
};
const filesResponse = await fetch(filesUrl, { headers: githubHeaders });
if (!filesResponse.ok)
  throw new Error(`Unable to retrieve pull request files (${filesResponse.status}).`);
const input = await collectReviewInput(
  {
    pull_request: event.pull_request,
    repository: process.env.GITHUB_REPOSITORY,
    files: await filesResponse.json(),
  },
  { githubHeaders }
);
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
