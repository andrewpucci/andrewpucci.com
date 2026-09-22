import { describe, expect, it, vi } from 'vite-plus/test';
import { collectUpstreamEvidence } from './upstream-evidence.mjs';

const response = (value: unknown) =>
  new Response(JSON.stringify(value), {
    headers: { 'Content-Type': 'application/json' },
  });

describe('collectUpstreamEvidence', () => {
  it('uses a target-version changelog when release evidence is unavailable', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(
        response({
          encoding: 'base64',
          content: Buffer.from('## 2.0.0\n\n- Changed the supported workflow.').toString('base64'),
          html_url: 'https://github.com/example/package/blob/v2.0.0/CHANGELOG.md',
        })
      );

    await expect(
      collectUpstreamEvidence({
        repository: 'example/package',
        dependency: { name: 'example', from: '1.0.0', to: '2.0.0' },
        fetchLike: fetchMock,
        githubHeaders: {},
      })
    ).resolves.toEqual({
      status: 'partial',
      availability: 'available',
      reason: 'Only the upstream changelog was available for this version range.',
      sources: [
        {
          kind: 'changelog',
          url: 'https://github.com/example/package/blob/v2.0.0/CHANGELOG.md',
          title: 'example 1.0.0 to 2.0.0 changelog',
          excerpt: '## 2.0.0\n\n- Changed the supported workflow.',
          range: { from: '1.0.0', to: '2.0.0' },
        },
      ],
    });
    expect(fetchMock.mock.calls.at(-1)?.[0]).toContain('/contents/CHANGELOG.md?ref=v2.0.0');
  });

  it('records that a publisher has no upgrade evidence when every source option is absent', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 404 }));

    await expect(
      collectUpstreamEvidence({
        repository: 'example/package',
        dependency: { name: 'example', from: '1.0.0', to: '2.0.0' },
        fetchLike: fetchMock,
        githubHeaders: {},
      })
    ).resolves.toEqual({
      status: 'unavailable',
      availability: 'not_published',
      reason: 'No upstream release, comparison, or changelog was available for this version range.',
      sources: [],
    });
  });

  it('records a failed upstream collection separately from publisher evidence absence', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('network failure'));

    await expect(
      collectUpstreamEvidence({
        repository: 'example/package',
        dependency: { name: 'example', from: '1.0.0', to: '2.0.0' },
        fetchLike: fetchMock,
        githubHeaders: {},
      })
    ).resolves.toEqual({
      status: 'unavailable',
      availability: 'collection_failed',
      reason: 'Upstream upgrade evidence could not be collected.',
      sources: [],
    });
  });
});
