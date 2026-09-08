import { readFile, readdir } from 'node:fs/promises';
import { analyze } from './analysis.mjs';
import { analyzeBatches } from './batches.mjs';
import { createGithubRequestGovernor, fetchAllPages } from './github.mjs';
import { collectPullRequestProvenance, collectReviewInput } from './inputs.mjs';
import { evaluatePolicy } from './policy.mjs';
import { renderComment } from './reporting.mjs';
import { createReviewMetadata } from './review-metadata.mjs';
import { parseReviewInput } from './schema.mjs';

const unavailableProvenance = {
  status: 'unavailable',
  invalid: 0,
  missing: 0,
  reason: 'The pull request provenance could not be collected.',
};

export async function loadReviewInput(
  { repository, number, githubToken },
  { fetchLike = fetch, onGithubRequestLimit = () => {} } = {}
) {
  const governor = createGithubRequestGovernor(fetchLike);
  const githubFetch = governor.fetch;
  const githubHeaders = {
    Authorization: `Bearer ${githubToken}`,
    Accept: 'application/vnd.github+json',
  };
  const pullRequestApi = `https://api.github.com/repos/${repository}/pulls/${number}`;
  try {
    const [pullRequestResponse, files, workflowFiles, sourceFiles] = await Promise.all([
      githubFetch(pullRequestApi, { headers: githubHeaders }),
      fetchAllPages({
        api: `${pullRequestApi}/files?per_page=100`,
        headers: githubHeaders,
        fetchLike: githubFetch,
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
      {
        fetchLike: githubFetch,
        githubHeaders,
        repositoryContext,
        collectCoverage: true,
        githubRequestDiagnostic: governor.diagnostic,
      }
    );
    const provenancePromise =
      pullRequest.user?.login === 'dependabot[bot]' &&
      files.some((file) => file?.filename === 'package-lock.json')
        ? collectPullRequestProvenance(
            { repository, headSha: pullRequest.head?.sha },
            { fetchLike: githubFetch, githubHeaders }
          ).catch(() => unavailableProvenance)
        : Promise.resolve(undefined);
    const [input, provenance] = await Promise.all([inputPromise, provenancePromise]);
    const { limit } = governor.diagnostic();
    if (limit) onGithubRequestLimit(limit);
    if (!input || !provenance) return input;
    return parseReviewInput({ ...input, provenance });
  } catch (error) {
    const { limit } = governor.diagnostic();
    if (!limit) throw error;
    onGithubRequestLimit(limit);
    return undefined;
  }
}

export async function buildReviewCommentFromInput(input, mistralApiKey, options = {}) {
  const { body } = await buildReviewFromInput(input, mistralApiKey, options);
  return body;
}

export function prepareReview(input, { repository } = {}) {
  const policy = evaluatePolicy(input);
  return {
    policy,
    metadata: createReviewMetadata(input, policy, { repository }),
  };
}

export async function buildReviewFromInput(
  input,
  mistralApiKey,
  { fetchLike = fetch, repository, prepared = prepareReview(input, { repository }) } = {}
) {
  const { policy, metadata } = prepared;
  const analysis = await analyzeBatches(
    { ...input, policy },
    {
      analyzeBatch: (batch, { timeoutMs }) =>
        analyze(batch, mistralApiKey, fetchLike, { timeoutMs }),
    }
  );
  const body = renderComment(analysis, {
    ...metadata,
    pullRequest: input.pullRequest,
    packages: input.packages,
    provenance: input.provenance,
  });
  return { analysis, body, metadata };
}

export async function buildReviewComment(
  { repository, number, githubToken, mistralApiKey },
  options = {}
) {
  const input = await loadReviewInput({ repository, number, githubToken }, options);
  return input
    ? buildReviewCommentFromInput(input, mistralApiKey, { ...options, repository })
    : null;
}
