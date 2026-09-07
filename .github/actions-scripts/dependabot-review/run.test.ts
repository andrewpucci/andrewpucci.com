import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const mocks = vi.hoisted(() => ({
  analyze: vi.fn(),
  analyzeBatches: vi.fn(),
  collectReviewInput: vi.fn(),
  deleteReviewComment: vi.fn(),
  evaluatePolicy: vi.fn(),
  fetch: vi.fn(),
  fetchAllPages: vi.fn(),
  pullRequestNumber: vi.fn(),
  readFile: vi.fn(),
  readdir: vi.fn(),
  renderComment: vi.fn(),
  upsertComment: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  default: { readFile: mocks.readFile, readdir: mocks.readdir },
  readFile: mocks.readFile,
  readdir: mocks.readdir,
}));
vi.mock('./analysis.mjs', () => ({ analyze: mocks.analyze }));
vi.mock('./batches.mjs', () => ({ analyzeBatches: mocks.analyzeBatches }));
vi.mock('./event.mjs', () => ({ pullRequestNumber: mocks.pullRequestNumber }));
vi.mock('./github.mjs', () => ({
  deleteReviewComment: mocks.deleteReviewComment,
  fetchAllPages: mocks.fetchAllPages,
  upsertComment: mocks.upsertComment,
}));
vi.mock('./inputs.mjs', () => ({ collectReviewInput: mocks.collectReviewInput }));
vi.mock('./policy.mjs', () => ({ evaluatePolicy: mocks.evaluatePolicy }));
vi.mock('./reporting.mjs', () => ({ renderComment: mocks.renderComment }));

const event = { workflow_run: { id: 1 } };
const pullRequest = { number: 42, head: { sha: 'head' } };
const input = { pullRequest: { headSha: 'head' }, packages: [] };
const policy = { verdictCeiling: 'merge', findings: [] };
const analysis = { verdict: 'merge' };

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
    vi.stubGlobal('fetch', mocks.fetch);
    for (const mock of Object.values(mocks)) mock.mockReset();
    mocks.readFile.mockResolvedValue(JSON.stringify(event));
    mocks.readdir.mockImplementation(async (path) =>
      path === '.github/workflows' ? ['dependabot.yml'] : ['lib/example.ts']
    );
    mocks.pullRequestNumber.mockResolvedValue(42);
    mocks.fetch.mockResolvedValue({ ok: true, json: async () => pullRequest });
    mocks.fetchAllPages.mockResolvedValue([{ filename: 'package.json' }]);
    mocks.collectReviewInput.mockResolvedValue(input);
    mocks.evaluatePolicy.mockReturnValue(policy);
    mocks.analyzeBatches.mockResolvedValue(analysis);
    mocks.renderComment.mockReturnValue('review body');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('passes paginated files, trusted context, policy, analysis, and rendered output through', async () => {
    await run();

    const githubHeaders = {
      Authorization: 'Bearer read-token',
      Accept: 'application/vnd.github+json',
    };
    expect(mocks.fetchAllPages).toHaveBeenCalledWith({
      api: 'https://api.github.com/repos/example/site/pulls/42/files?per_page=100',
      headers: githubHeaders,
      action: 'retrieve pull request files',
    });
    expect(mocks.collectReviewInput).toHaveBeenCalledWith(
      {
        pull_request: pullRequest,
        repository: 'example/site',
        files: [{ filename: 'package.json' }],
      },
      {
        githubHeaders,
        repositoryContext: expect.objectContaining({
          paths: expect.arrayContaining([
            'package.json',
            '.github/workflows/dependabot.yml',
            'src/lib/example.ts',
          ]),
          readFile: expect.any(Function),
        }),
      }
    );
    const repositoryContext = mocks.collectReviewInput.mock.calls[0][1].repositoryContext;
    await repositoryContext.readFile('package.json');
    expect(mocks.readFile).toHaveBeenLastCalledWith('package.json', 'utf8');
    expect(mocks.analyzeBatches).toHaveBeenCalledWith(
      { ...input, policy },
      { analyzeBatch: expect.any(Function) }
    );
    const analyzeBatch = mocks.analyzeBatches.mock.calls[0][1].analyzeBatch;
    await analyzeBatch({ packages: [] }, { timeoutMs: 1_000 });
    expect(mocks.analyze).toHaveBeenCalledWith({ packages: [] }, 'mistral-key', mocks.fetch, {
      timeoutMs: 1_000,
    });
    expect(mocks.renderComment).toHaveBeenCalledWith(analysis, 'head');
    expect(mocks.upsertComment).toHaveBeenCalledWith({
      api: 'https://api.github.com/repos/example/site/issues/42/comments',
      body: 'review body',
      headers: {
        Authorization: 'Bearer comment-token',
        Accept: 'application/vnd.github+json',
      },
      author: 'reviewer[bot]',
    });
  });

  it('updates the managed comment when analysis is unavailable', async () => {
    mocks.analyzeBatches.mockResolvedValue({ verdict: 'analysis_unavailable' });

    await run();

    expect(mocks.renderComment).toHaveBeenCalledWith({ verdict: 'analysis_unavailable' }, 'head');
    expect(mocks.upsertComment).toHaveBeenCalledTimes(1);
    expect(mocks.deleteReviewComment).not.toHaveBeenCalled();
  });

  it('removes the managed comment and stops when no review input is available', async () => {
    mocks.collectReviewInput.mockResolvedValue(null);

    await run();

    expect(mocks.deleteReviewComment).toHaveBeenCalledWith({
      api: 'https://api.github.com/repos/example/site/issues/42/comments',
      headers: {
        Authorization: 'Bearer comment-token',
        Accept: 'application/vnd.github+json',
      },
      author: 'reviewer[bot]',
    });
    expect(mocks.analyzeBatches).not.toHaveBeenCalled();
    expect(mocks.upsertComment).not.toHaveBeenCalled();
  });
});
