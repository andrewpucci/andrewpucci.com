import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const mocks = vi.hoisted(() => ({
  collectPullRequestProvenance: vi.fn(),
  collectReviewInput: vi.fn(),
  fetch: vi.fn(),
  fetchAllPages: vi.fn(),
  readFile: vi.fn(),
  readdir: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  default: { readFile: mocks.readFile, readdir: mocks.readdir },
  readFile: mocks.readFile,
  readdir: mocks.readdir,
}));
vi.mock('./github.mjs', () => ({ fetchAllPages: mocks.fetchAllPages }));
vi.mock('./inputs.mjs', () => ({
  collectPullRequestProvenance: mocks.collectPullRequestProvenance,
  collectReviewInput: mocks.collectReviewInput,
}));

const { loadReviewInput } = await import('./review.mjs');

const pullRequest = {
  number: 42,
  base: { sha: 'base' },
  head: { sha: 'immutable-head' },
  user: { login: 'dependabot[bot]' },
};
const input = {
  pullRequest: { number: 42, baseSha: 'base', headSha: 'immutable-head' },
  packages: [
    {
      name: 'example',
      from: '1.0.0',
      to: '2.0.0',
      dependencyType: 'direct:development',
      license: null,
      evidence: { status: 'available', reason: null },
      context: { status: 'unavailable', facts: [] },
      sources: [
        {
          kind: 'release-notes',
          url: 'https://example.com/releases/2.0.0',
          title: 'Example 2.0.0',
          excerpt: 'Example release notes.',
          range: { from: '1.0.0', to: '2.0.0' },
        },
      ],
      findings: [],
    },
  ],
};

describe('trusted Dependabot review input', () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
    mocks.fetch.mockResolvedValue({ ok: true, json: async () => pullRequest });
    mocks.readdir.mockResolvedValue([]);
    mocks.collectReviewInput.mockResolvedValue(input);
  });

  it('collects immutable npm provenance alongside normal input and preserves unavailable evidence', async () => {
    mocks.fetchAllPages.mockResolvedValue([{ filename: 'package-lock.json' }]);
    mocks.collectPullRequestProvenance.mockResolvedValue({
      status: 'unavailable',
      invalid: 0,
      missing: 0,
      reason: 'The npm verifier did not return usable evidence.',
    });

    await expect(
      loadReviewInput(
        { repository: 'owner/repo', number: 42, githubToken: 'read-token' },
        { fetchLike: mocks.fetch }
      )
    ).resolves.toEqual({
      ...input,
      provenance: {
        status: 'unavailable',
        invalid: 0,
        missing: 0,
        reason: 'The npm verifier did not return usable evidence.',
      },
    });
    expect(mocks.collectPullRequestProvenance).toHaveBeenCalledWith(
      { repository: 'owner/repo', headSha: 'immutable-head' },
      {
        fetchLike: mocks.fetch,
        githubHeaders: {
          Authorization: 'Bearer read-token',
          Accept: 'application/vnd.github+json',
        },
      }
    );
  });

  it('leaves non-npm review input unchanged', async () => {
    mocks.fetchAllPages.mockResolvedValue([{ filename: '.github/workflows/ci.yml' }]);

    await expect(
      loadReviewInput(
        { repository: 'owner/repo', number: 42, githubToken: 'read-token' },
        { fetchLike: mocks.fetch }
      )
    ).resolves.toEqual(input);
    expect(mocks.collectPullRequestProvenance).not.toHaveBeenCalled();
  });

  it('keeps the reviewable input when provenance collection rejects', async () => {
    mocks.fetchAllPages.mockResolvedValue([{ filename: 'package-lock.json' }]);
    mocks.collectPullRequestProvenance.mockRejectedValue(new Error('untrusted detail'));

    await expect(
      loadReviewInput(
        { repository: 'owner/repo', number: 42, githubToken: 'read-token' },
        { fetchLike: mocks.fetch }
      )
    ).resolves.toEqual({
      ...input,
      provenance: {
        status: 'unavailable',
        invalid: 0,
        missing: 0,
        reason: 'The pull request provenance could not be collected.',
      },
    });
  });
});
