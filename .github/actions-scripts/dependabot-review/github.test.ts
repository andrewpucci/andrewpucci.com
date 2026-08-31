import { describe, expect, it } from 'vite-plus/test';
import { upsertComment } from './github.mjs';

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
});
