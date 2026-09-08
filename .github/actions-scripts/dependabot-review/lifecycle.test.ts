/// <reference types="node" />

import { describe, expect, it, vi } from 'vite-plus/test';
import { collectLifecycleScripts } from './lifecycle.mjs';

function pendingCoverage(name = 'direct') {
  return {
    items: [
      {
        update: {
          ecosystem: 'npm',
          name,
          from: '1.0.0',
          to: '2.0.0',
          dependencyType: 'direct:production',
        },
        group: { kind: 'direct', anchor: { name, from: '1.0.0', to: '2.0.0' } },
        lifecycle: {
          status: 'changed',
          metadata: 'pending',
          changes: [],
          paths: [`node_modules/${name}`],
          reason: null,
        },
        status: 'pending',
        reason: 'lifecycle_metadata_pending',
      },
    ],
  };
}

describe('collectLifecycleScripts', () => {
  it('retrieves exact package metadata only when a lifecycle-script signal changes', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ name: 'direct', version: '1.0.0', scripts: {} }))
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            name: 'direct',
            version: '2.0.0',
            scripts: { postinstall: 'node ./setup.js' },
          })
        )
      );

    const result = await collectLifecycleScripts(pendingCoverage(), { fetchLike: fetchMock });

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'https://registry.npmjs.org/direct/1.0.0',
      'https://registry.npmjs.org/direct/2.0.0',
    ]);
    expect(fetchMock.mock.calls.every(([, options]) => options.redirect === 'error')).toBe(true);
    expect(result.items[0]).toMatchObject({
      lifecycle: {
        status: 'changed',
        metadata: 'available',
        changes: [{ name: 'postinstall', kind: 'added', after: 'node ./setup.js' }],
      },
      status: 'complete',
    });
  });

  it('keeps a changed lifecycle signal unresolved when exact metadata is unavailable', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            name: 'direct',
            version: '2.0.0',
            scripts: { postinstall: 'node ./setup.js' },
          })
        )
      );

    const result = await collectLifecycleScripts(pendingCoverage(), { fetchLike: fetchMock });

    expect(result.items[0]).toMatchObject({
      lifecycle: { status: 'changed', metadata: 'unavailable', changes: [] },
      status: 'unresolved',
      reason: 'lifecycle_metadata_unavailable',
    });
  });

  it('bounds lifecycle metadata requests and leaves excess items unresolved', async () => {
    const coverage = {
      items: Array.from({ length: 13 }, (_, index) => pendingCoverage(`direct-${index}`).items[0]),
    };
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const [, name, version] = new URL(input.toString()).pathname.split('/').filter(Boolean);
      return new Response(
        JSON.stringify({
          name,
          version,
          scripts: version === '2.0.0' ? { postinstall: 'node ./setup.js' } : {},
        })
      );
    });

    const result = await collectLifecycleScripts(coverage, {
      fetchLike: fetchMock as typeof fetch,
    });

    expect(fetchMock).toHaveBeenCalledTimes(24);
    expect(result.items[12]).toMatchObject({
      lifecycle: { metadata: 'unavailable', reason: 'metadata_budget_exhausted' },
      status: 'unresolved',
      reason: 'lifecycle_metadata_budget_exhausted',
    });
  });
});
