import { describe, expect, it, vi } from 'vite-plus/test';
import { deleteReviewComment, upsertComment } from './github.mjs';

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
