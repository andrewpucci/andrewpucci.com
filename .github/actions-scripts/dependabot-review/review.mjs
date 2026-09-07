import { readFile, readdir } from 'node:fs/promises';
import { analyze } from './analysis.mjs';
import { analyzeBatches } from './batches.mjs';
import { fetchAllPages } from './github.mjs';
import { collectPullRequestProvenance, collectReviewInput } from './inputs.mjs';
import { evaluatePolicy } from './policy.mjs';
import { renderComment } from './reporting.mjs';
import { parseReviewInput } from './schema.mjs';

const unavailableProvenance = {
  status: 'unavailable',
  invalid: 0,
  missing: 0,
  reason: 'The pull request provenance could not be collected.',
};

export async function loadReviewInput(
  { repository, number, githubToken },
  { fetchLike = fetch } = {}
) {
  const githubHeaders = {
    Authorization: `Bearer ${githubToken}`,
    Accept: 'application/vnd.github+json',
  };
  const pullRequestApi = `https://api.github.com/repos/${repository}/pulls/${number}`;
  const [pullRequestResponse, files, workflowFiles, sourceFiles] = await Promise.all([
    fetchLike(pullRequestApi, { headers: githubHeaders }),
    fetchAllPages({
      api: `${pullRequestApi}/files?per_page=100`,
      headers: githubHeaders,
      fetchLike,
      action: 'retrieve pull request files',
    }),
    readdir('.github/workflows'),
    readdir('src', { recursive: true }),
  ]);
  if (!pullRequestResponse.ok)
    throw new Error(`Unable to retrieve pull request (${pullRequestResponse.status}).`);
  const pullRequest = await pullRequestResponse.json();
  const repositoryContext = {
    paths: [
      'package.json',
      'package-lock.json',
      'pnpm-lock.yaml',
      'yarn.lock',
      'vite.config.ts',
      'svelte.config.js',
      ...workflowFiles.map((path) => `.github/workflows/${path}`),
      ...sourceFiles.map((path) => `src/${path}`),
    ],
    // Production checks out only the trusted default branch; local callers must run from a trusted checkout.
    // oxlint-disable-next-line security/detect-non-literal-fs-filename
    readFile: (path) => readFile(path, 'utf8'),
  };
  const inputPromise = collectReviewInput(
    { pull_request: pullRequest, repository, files },
    { fetchLike, githubHeaders, repositoryContext }
  );
  const provenancePromise =
    pullRequest.user?.login === 'dependabot[bot]' &&
    files.some((file) => file?.filename === 'package-lock.json')
      ? collectPullRequestProvenance(
          { repository, headSha: pullRequest.head?.sha },
          { fetchLike, githubHeaders }
        ).catch(() => unavailableProvenance)
      : Promise.resolve(undefined);
  const [input, provenance] = await Promise.all([inputPromise, provenancePromise]);
  if (!input || !provenance) return input;
  return parseReviewInput({ ...input, provenance });
}

export async function buildReviewCommentFromInput(
  input,
  mistralApiKey,
  { fetchLike = fetch } = {}
) {
  const analysis = await analyzeBatches(
    { ...input, policy: evaluatePolicy(input) },
    {
      analyzeBatch: (batch, { timeoutMs }) =>
        analyze(batch, mistralApiKey, fetchLike, { timeoutMs }),
    }
  );
  return renderComment(analysis, input.pullRequest.headSha);
}

export async function buildReviewComment(
  { repository, number, githubToken, mistralApiKey },
  options = {}
) {
  const input = await loadReviewInput({ repository, number, githubToken }, options);
  return input ? buildReviewCommentFromInput(input, mistralApiKey, options) : null;
}
