import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const mocks = vi.hoisted(() => ({
  buildReviewFromInput: vi.fn(),
  deleteReviewComment: vi.fn(),
  emitGithubRequestDiagnostic: vi.fn(),
  emitReviewDiagnostic: vi.fn(),
  findReviewComment: vi.fn(),
  loadReviewInput: vi.fn(),
  prepareReview: vi.fn(),
  pullRequestNumber: vi.fn(),
  readFile: vi.fn(),
  upsertComment: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  default: { readFile: mocks.readFile },
  readFile: mocks.readFile,
}));
vi.mock('./diagnostics.mjs', () => ({
  emitGithubRequestDiagnostic: mocks.emitGithubRequestDiagnostic,
  emitReviewDiagnostic: mocks.emitReviewDiagnostic,
}));
vi.mock('./event.mjs', () => ({ pullRequestNumber: mocks.pullRequestNumber }));
vi.mock('./github.mjs', () => ({
  deleteReviewComment: mocks.deleteReviewComment,
  findReviewComment: mocks.findReviewComment,
  upsertComment: mocks.upsertComment,
}));
vi.mock('./review.mjs', () => ({
  buildReviewFromInput: mocks.buildReviewFromInput,
  loadReviewInput: mocks.loadReviewInput,
  prepareReview: mocks.prepareReview,
}));

const event = { workflow_run: { id: 1, head_sha: 'head', conclusion: 'success' } };
const input = { pullRequest: { headSha: 'head' }, packages: [] };
const metadata = {
  headSha: 'head',
  reviewDigest: 'd'.repeat(64),
  modelVersion: 'mistral-medium-latest',
  promptVersion: 'dependabot-review-v2',
  coverage: { complete: 0, pending: 0, unresolved: 0 },
};

async function run() {
  await import('./run.mjs');
}

describe('Dependabot review runner', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('GITHUB_EVENT_PATH', '/tmp/event.json');
    vi.stubEnv('GITHUB_REPOSITORY', 'example/site');
    vi.stubEnv('GITHUB_TOKEN', 'read-token');
    vi.stubEnv('GITHUB_COMMENT_TOKEN', 'comment-token');
    vi.stubEnv('GITHUB_COMMENT_AUTHOR', 'reviewer[bot]');
    vi.stubEnv('MISTRAL_API_KEY', 'mistral-key');
    for (const mock of Object.values(mocks)) mock.mockReset();
    mocks.readFile.mockResolvedValue(JSON.stringify(event));
    mocks.pullRequestNumber.mockResolvedValue(42);
    mocks.loadReviewInput.mockResolvedValue(input);
    mocks.prepareReview.mockReturnValue({
      policy: { verdictCeiling: 'merge', findings: [] },
      metadata,
    });
    mocks.findReviewComment.mockResolvedValue(null);
    mocks.buildReviewFromInput.mockResolvedValue({
      analysis: { verdict: 'merge' },
      body: 'review body',
      metadata,
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses the prepared immutable packet for one bounded analysis and managed upsert', async () => {
    await run();

    expect(mocks.loadReviewInput).toHaveBeenCalledWith(
      {
        repository: 'example/site',
        number: 42,
        githubToken: 'read-token',
      },
      expect.objectContaining({ onGithubRequestLimit: expect.any(Function) })
    );
    expect(mocks.prepareReview).toHaveBeenCalledWith(input, { repository: 'example/site' });
    expect(mocks.findReviewComment).toHaveBeenCalledWith({
      api: 'https://api.github.com/repos/example/site/issues/42/comments',
      headers: {
        Authorization: 'Bearer comment-token',
        Accept: 'application/vnd.github+json',
      },
      author: 'reviewer[bot]',
    });
    expect(mocks.buildReviewFromInput).toHaveBeenCalledWith(input, 'mistral-key', {
      repository: 'example/site',
      prepared: expect.objectContaining({ metadata }),
    });
    expect(mocks.upsertComment).toHaveBeenCalledWith({
      api: 'https://api.github.com/repos/example/site/issues/42/comments',
      body: 'review body',
      headers: {
        Authorization: 'Bearer comment-token',
        Accept: 'application/vnd.github+json',
      },
      author: 'reviewer[bot]',
    });
    expect(mocks.emitReviewDiagnostic).toHaveBeenCalledWith(metadata, 'none');
  });

  it('withholds the advisory recommendation when the triggering CI run did not succeed', async () => {
    mocks.readFile.mockResolvedValue(
      JSON.stringify({
        workflow_run: { id: 1, head_sha: 'head', conclusion: 'failure' },
      })
    );

    await run();

    expect(mocks.loadReviewInput).not.toHaveBeenCalled();
    expect(mocks.prepareReview).not.toHaveBeenCalled();
    expect(mocks.buildReviewFromInput).not.toHaveBeenCalled();
    expect(mocks.upsertComment).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.stringContaining('**Advisory verdict:** decision incomplete'),
      })
    );
    expect(mocks.upsertComment).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.stringContaining('https://github.com/example/site/actions/runs/1'),
      })
    );
  });

  it('skips packet loading for a current immutable event head and digest', async () => {
    mocks.findReviewComment.mockResolvedValue({
      body: `<!-- dependabot-intelligent-review -->\n<!-- reviewed-head: head -->\n<!-- review-digest: ${'d'.repeat(64)} -->`,
    });

    await run();

    expect(mocks.loadReviewInput).not.toHaveBeenCalled();
    expect(mocks.prepareReview).not.toHaveBeenCalled();
    expect(mocks.buildReviewFromInput).not.toHaveBeenCalled();
    expect(mocks.upsertComment).not.toHaveBeenCalled();
    expect(mocks.emitReviewDiagnostic).toHaveBeenCalledWith(
      expect.objectContaining({
        headSha: 'head',
        reviewDigest: 'd'.repeat(64),
        modelVersion: null,
        promptVersion: null,
        coverage: null,
      }),
      'duplicate_review'
    );
  });

  it('emits a bounded failure category after incomplete analysis', async () => {
    mocks.buildReviewFromInput.mockResolvedValue({
      analysis: { verdict: 'decision_incomplete' },
      body: 'incomplete review body',
      metadata,
    });

    await run();

    expect(mocks.emitReviewDiagnostic).toHaveBeenCalledWith(metadata, 'decision_incomplete');
  });

  it('reruns and replaces the managed comment when the previous head is stale', async () => {
    mocks.findReviewComment.mockResolvedValue({
      body: `<!-- dependabot-intelligent-review -->\n<!-- reviewed-head: stale-head -->\n<!-- review-digest: ${'d'.repeat(64)} -->`,
    });

    await run();

    expect(mocks.buildReviewFromInput).toHaveBeenCalledTimes(1);
    expect(mocks.upsertComment).toHaveBeenCalledTimes(1);
  });

  it('allows an explicit refresh of a current review', async () => {
    vi.stubEnv('DEPENDABOT_REVIEW_REFRESH', 'true');
    mocks.findReviewComment.mockResolvedValue({
      body: `<!-- dependabot-intelligent-review -->\n<!-- reviewed-head: head -->\n<!-- review-digest: ${'d'.repeat(64)} -->`,
    });

    await run();

    expect(mocks.buildReviewFromInput).toHaveBeenCalledTimes(1);
  });

  it('removes the managed comment and stops when no review input is available', async () => {
    mocks.loadReviewInput.mockResolvedValue(null);

    await run();

    expect(mocks.deleteReviewComment).toHaveBeenCalledWith({
      api: 'https://api.github.com/repos/example/site/issues/42/comments',
      headers: {
        Authorization: 'Bearer comment-token',
        Accept: 'application/vnd.github+json',
      },
      author: 'reviewer[bot]',
    });
    expect(mocks.prepareReview).not.toHaveBeenCalled();
    expect(mocks.upsertComment).not.toHaveBeenCalled();
  });

  it('emits a safe request-limit diagnostic and preserves the existing comment', async () => {
    mocks.findReviewComment.mockResolvedValue({ body: 'existing review' });
    mocks.loadReviewInput.mockImplementation(async (_request, { onGithubRequestLimit }) => {
      onGithubRequestLimit({ status: 429, resource: 'core', remaining: 0, reset: 123 });
      return undefined;
    });

    await run();

    expect(mocks.emitGithubRequestDiagnostic).toHaveBeenCalledWith(
      { status: 429, resource: 'core', remaining: 0, reset: 123 },
      { headSha: 'head' }
    );
    expect(mocks.deleteReviewComment).not.toHaveBeenCalled();
    expect(mocks.prepareReview).not.toHaveBeenCalled();
    expect(mocks.buildReviewFromInput).not.toHaveBeenCalled();
    expect(mocks.upsertComment).not.toHaveBeenCalled();
  });
});
