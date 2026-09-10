import { describe, expect, it, vi } from 'vite-plus/test';
import {
  GithubRequestLimitError,
  createGithubRequestGovernor,
  deleteReviewComment,
  fetchAllPages,
  findReviewComment,
  upsertComment,
} from './github.mjs';

function deferred() {
  let resolve: (value: Response) => void;
  const promise = new Promise<Response>((res) => {
    resolve = res;
  });
  return { promise, resolve: resolve! };
}

describe('GitHub request governor', () => {
  it('dispatches at most the configured number of GitHub requests concurrently', async () => {
    const first = deferred();
    const second = deferred();
    const third = deferred();
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
      .mockReturnValueOnce(third.promise);
    const governor = createGithubRequestGovernor(fetchMock, { maxConcurrency: 2 });

    const requests = [
      governor.fetch('https://api.github.com/repos/example/one'),
      governor.fetch('https://api.github.com/repos/example/two'),
      governor.fetch('https://api.github.com/repos/example/three'),
    ];
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    first.resolve(Response.json({ one: true }));
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    second.resolve(Response.json({ two: true }));
    third.resolve(Response.json({ three: true }));

    await expect(Promise.all(requests)).resolves.toHaveLength(3);
  });

  it('deduplicates safe GitHub GETs without governing npm registry requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ value: true }));
    const governor = createGithubRequestGovernor(fetchMock);

    const [first, second, registry] = await Promise.all([
      governor.fetch('https://api.github.com/repos/example/site/releases/tags/v1'),
      governor.fetch('https://api.github.com/repos/example/site/releases/tags/v1'),
      governor.fetch('https://registry.npmjs.org/example'),
    ]);

    await expect(first.json()).resolves.toEqual({ value: true });
    await expect(second.json()).resolves.toEqual({ value: true });
    await expect(registry.json()).resolves.toEqual({ value: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(governor.diagnostic()).toEqual({ requests: 1, limit: null });
  });

  it('stops dispatching after its request budget is exhausted', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ value: true }));
    const governor = createGithubRequestGovernor(fetchMock, { maxRequests: 1 });

    await governor.fetch('https://api.github.com/repos/example/one');
    await expect(governor.fetch('https://api.github.com/repos/example/two')).rejects.toBeInstanceOf(
      GithubRequestLimitError
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(governor.diagnostic()).toEqual({
      requests: 1,
      limit: { status: 'request_budget_exhausted' },
    });
  });

  it('stops after GitHub returns a rate-limit response without retrying', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('rate limited', {
        status: 429,
        headers: {
          'x-ratelimit-resource': 'core',
          'x-ratelimit-remaining': '0',
          'x-ratelimit-reset': '1788840696',
          'retry-after': '60',
        },
      })
    );
    const governor = createGithubRequestGovernor(fetchMock);

    await expect(governor.fetch('https://api.github.com/repos/example/one')).resolves.toMatchObject(
      {
        status: 429,
      }
    );
    await expect(governor.fetch('https://api.github.com/repos/example/two')).rejects.toBeInstanceOf(
      GithubRequestLimitError
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(governor.diagnostic()).toEqual({
      requests: 1,
      limit: {
        status: 429,
        resource: 'core',
        remaining: 0,
        reset: 1788840696,
        retryAfter: 60,
      },
    });
  });

  it('rejects requests that were queued when a rate limit stopped the governor', async () => {
    const first = deferred();
    const fetchMock = vi.fn().mockReturnValue(first.promise);
    const governor = createGithubRequestGovernor(fetchMock, { maxConcurrency: 1 });

    const active = governor.fetch('https://api.github.com/repos/example/one');
    const queued = governor.fetch('https://api.github.com/repos/example/two');
    first.resolve(new Response('rate limited', { status: 429 }));

    await expect(active).resolves.toMatchObject({ status: 429 });
    await expect(queued).rejects.toBeInstanceOf(GithubRequestLimitError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('fetchAllPages', () => {
  it('retrieves every GitHub API page in the Link header', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ filename: 'first.yml' }]), {
          headers: {
            Link: '<https://api.github.com/repos/example/site/pulls/1/files?per_page=100&page=2>; rel="next"',
          },
        })
      )
      .mockResolvedValueOnce(Response.json([{ filename: 'second.yml' }]));

    await expect(
      fetchAllPages({
        api: 'https://api.github.com/repos/example/site/pulls/1/files?per_page=100',
        headers: { Authorization: 'Bearer test' },
        fetchLike: fetchMock,
        action: 'retrieve pull request files',
      })
    ).resolves.toEqual([{ filename: 'first.yml' }, { filename: 'second.yml' }]);
    expect(fetchMock).toHaveBeenLastCalledWith(
      'https://api.github.com/repos/example/site/pulls/1/files?per_page=100&page=2',
      { headers: { Authorization: 'Bearer test' } }
    );
  });
});

describe('upsertComment', () => {
  it('fails when GitHub rejects listing existing review comments', async () => {
    const fetchLike: typeof fetch = async () => new Response('Forbidden', { status: 403 });

    await expect(
      upsertComment({
        api: 'https://api.github.com/repos/example/site/issues/1/comments',
        body: 'Review body',
        headers: { Authorization: 'Bearer test' },
        fetchLike,
      })
    ).rejects.toThrow('Unable to list Dependabot review comments (403): Forbidden');
  });

  it("reports GitHub's accepted permissions when a comment request is rejected", async () => {
    const fetchLike: typeof fetch = async () =>
      new Response('Forbidden', {
        status: 403,
        headers: { 'X-Accepted-GitHub-Permissions': 'issues=write' },
      });

    await expect(
      upsertComment({
        api: 'https://api.github.com/repos/example/site/issues/1/comments',
        body: 'Review body',
        headers: { Authorization: 'Bearer test' },
        fetchLike,
      })
    ).rejects.toThrow('Accepted GitHub permissions: issues=write');
  });

  it('fails when GitHub rejects creation of the review comment', async () => {
    const fetchLike: typeof fetch = async (_url: RequestInfo | URL, options?: RequestInit) =>
      options?.method === 'POST'
        ? new Response('Resource not accessible by integration', { status: 403 })
        : Response.json([]);

    await expect(
      upsertComment({
        api: 'https://api.github.com/repos/example/site/issues/1/comments',
        body: 'Review body',
        headers: { Authorization: 'Bearer test' },
        fetchLike,
      })
    ).rejects.toThrow(
      'Unable to create Dependabot review comment (403): Resource not accessible by integration'
    );
  });

  it('updates the existing comment created by the GitHub App', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      Response.json([
        {
          id: 1,
          user: { login: 'dependabot-review-commenter[bot]' },
          body: '<!-- dependabot-intelligent-review -->',
        },
      ])
    );
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 200 }));

    await upsertComment({
      api: 'https://api.github.com/repos/example/site/issues/1/comments',
      body: 'Updated review body',
      headers: { Authorization: 'Bearer app-token' },
      author: 'dependabot-review-commenter[bot]',
      fetchLike: fetchMock,
    });

    expect(fetchMock).toHaveBeenLastCalledWith(
      'https://api.github.com/repos/example/site/issues/comments/1',
      expect.objectContaining({ method: 'PATCH' })
    );
  });
});

describe('findReviewComment', () => {
  it('returns only the managed comment created by the configured app', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json([
        { id: 1, user: { login: 'someone-else' }, body: '<!-- dependabot-intelligent-review -->' },
        {
          id: 2,
          user: { login: 'dependabot-review-commenter[bot]' },
          body: '<!-- dependabot-intelligent-review -->\n<!-- reviewed-head: head -->',
        },
      ])
    );

    await expect(
      findReviewComment({
        api: 'https://api.github.com/repos/example/site/issues/1/comments',
        headers: { Authorization: 'Bearer app-token' },
        author: 'dependabot-review-commenter[bot]',
        fetchLike: fetchMock,
      })
    ).resolves.toMatchObject({ id: 2 });
  });
});

describe('deleteReviewComment', () => {
  it('removes the existing managed review comment', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      Response.json([
        {
          id: 1,
          user: { login: 'dependabot-review-commenter[bot]' },
          body: '<!-- dependabot-intelligent-review -->\n**Advisory verdict:** merge',
        },
      ])
    );
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await deleteReviewComment({
      api: 'https://api.github.com/repos/example/site/issues/1/comments',
      headers: { Authorization: 'Bearer app-token' },
      author: 'dependabot-review-commenter[bot]',
      fetchLike: fetchMock,
    });

    expect(fetchMock).toHaveBeenLastCalledWith(
      'https://api.github.com/repos/example/site/issues/comments/1',
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});
