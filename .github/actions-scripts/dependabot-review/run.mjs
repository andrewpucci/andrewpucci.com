import { readFile } from 'node:fs/promises';
import { analyze } from './analysis.mjs';
import { pullRequestNumber } from './event.mjs';
import { deleteReviewComment, fetchAllPages, upsertComment } from './github.mjs';
import { collectReviewInput } from './inputs.mjs';
import { renderComment } from './reporting.mjs';

const eventPath = process.env.GITHUB_EVENT_PATH;
if (!eventPath) throw new Error('GITHUB_EVENT_PATH is required.');
// oxlint-disable-next-line security/detect-non-literal-fs-filename -- GitHub Actions supplies this runner path.
const event = JSON.parse(await readFile(eventPath, 'utf8'));
const commentToken = process.env.GITHUB_COMMENT_TOKEN;
const commentAuthor = process.env.GITHUB_COMMENT_AUTHOR;
if (!commentToken || !commentAuthor)
  throw new Error('GITHUB_COMMENT_TOKEN and GITHUB_COMMENT_AUTHOR are required.');
const githubHeaders = {
  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  Accept: 'application/vnd.github+json',
};
const commentHeaders = {
  Authorization: `Bearer ${commentToken}`,
  Accept: 'application/vnd.github+json',
};
const number = await pullRequestNumber(event, {
  repository: process.env.GITHUB_REPOSITORY,
  githubHeaders,
});
const pullRequestApi = `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/pulls/${number}`;
const commentApi = `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/issues/${number}/comments`;
const [pullRequestResponse, files] = await Promise.all([
  fetch(pullRequestApi, { headers: githubHeaders }),
  fetchAllPages({
    api: `${pullRequestApi}/files?per_page=100`,
    headers: githubHeaders,
    action: 'retrieve pull request files',
  }),
]);
if (!pullRequestResponse.ok)
  throw new Error(`Unable to retrieve pull request (${pullRequestResponse.status}).`);
const input = await collectReviewInput(
  {
    pull_request: await pullRequestResponse.json(),
    repository: process.env.GITHUB_REPOSITORY,
    files,
  },
  { githubHeaders }
);
if (!input) {
  await deleteReviewComment({ api: commentApi, headers: commentHeaders, author: commentAuthor });
  process.exit(0);
}
const analysis = await analyze(input, process.env.MISTRAL_API_KEY);
const body = renderComment(analysis, input.pullRequest.headSha);
await upsertComment({
  api: commentApi,
  body,
  headers: commentHeaders,
  author: commentAuthor,
});
