import { readFile } from 'node:fs/promises';
import { emitReviewDiagnostic } from './diagnostics.mjs';
import { pullRequestNumber } from './event.mjs';
import { managedReviewMetadata, shouldSkipAnalysis, shouldSkipCurrentHead } from './freshness.mjs';
import { deleteReviewComment, findReviewComment, upsertComment } from './github.mjs';
import { buildReviewFromInput, loadReviewInput, prepareReview } from './review.mjs';

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
const existing = await findReviewComment({
  api: commentApi,
  headers: commentHeaders,
  author: commentAuthor,
});
const refresh = process.env.DEPENDABOT_REVIEW_REFRESH === 'true';
const eventHeadSha = event?.workflow_run?.head_sha;
if (shouldSkipCurrentHead(existing, eventHeadSha, { refresh })) {
  const { reviewDigest } = managedReviewMetadata(existing.body);
  emitReviewDiagnostic(
    {
      headSha: eventHeadSha,
      reviewDigest,
      modelVersion: null,
      promptVersion: null,
      coverage: null,
    },
    'duplicate_review'
  );
} else {
  const input = await loadReviewInput({
    repository: process.env.GITHUB_REPOSITORY,
    number,
    githubToken: process.env.GITHUB_TOKEN,
  });
  if (!input) {
    await deleteReviewComment({ api: commentApi, headers: commentHeaders, author: commentAuthor });
  } else {
    const prepared = prepareReview(input, { repository: process.env.GITHUB_REPOSITORY });
    if (shouldSkipAnalysis(existing, prepared.metadata, { refresh })) {
      emitReviewDiagnostic(prepared.metadata, 'duplicate_review');
    } else {
      const { analysis, body } = await buildReviewFromInput(input, process.env.MISTRAL_API_KEY, {
        repository: process.env.GITHUB_REPOSITORY,
        prepared,
      });
      emitReviewDiagnostic(
        prepared.metadata,
        ['analysis_unavailable', 'decision_incomplete'].includes(analysis.verdict)
          ? analysis.verdict
          : 'none'
      );
      await upsertComment({
        api: commentApi,
        body,
        headers: commentHeaders,
        author: commentAuthor,
      });
    }
  }
}
