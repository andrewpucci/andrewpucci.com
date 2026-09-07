import { readFile } from 'node:fs/promises';
import { pullRequestNumber } from './event.mjs';
import { deleteReviewComment, upsertComment } from './github.mjs';
import { buildReviewComment } from './review.mjs';

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
const commentApi = `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/issues/${number}/comments`;
const body = await buildReviewComment({
  repository: process.env.GITHUB_REPOSITORY,
  number,
  githubToken: process.env.GITHUB_TOKEN,
  mistralApiKey: process.env.MISTRAL_API_KEY,
});
if (!body) {
  await deleteReviewComment({ api: commentApi, headers: commentHeaders, author: commentAuthor });
} else {
  await upsertComment({
    api: commentApi,
    body,
    headers: commentHeaders,
    author: commentAuthor,
  });
}
