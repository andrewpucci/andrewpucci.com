import { describe, expect, it } from 'vite-plus/test';
import { renderResearchHandoff } from './handoff.mjs';

const pullRequest = { number: 271, headSha: 'immutable-head' };
const packages = [
  {
    name: 'nested-package',
    from: '1.0.0',
    to: '2.0.0',
    sources: [{ url: 'https://github.com/example/nested-package/releases/tag/v2.0.0' }],
  },
  {
    name: 'direct-package',
    from: '1.0.0',
    to: '2.0.0',
    sources: [
      { url: 'https://github.com/example/direct-package/releases/tag/v2.0.0' },
      { url: 'https://example.com/ignored-after-the-bound' },
      { url: 'https://example.com/also-ignored' },
    ],
  },
];
const item = {
  group: {
    kind: 'direct',
    anchor: { name: 'direct-package', from: '1.0.0', to: '2.0.0' },
  },
  members: packages.map(({ name, from, to }) => ({ name, from, to })),
  count: 2,
  reason: 'coverage_inputs_unavailable',
  action: 'Inspect the cited direct-update evidence.',
  lifecycle: [
    {
      update: { name: 'direct-package', from: '1.0.0', to: '2.0.0' },
      status: 'unavailable',
      metadata: 'unavailable',
      reason: 'Registry metadata was unavailable.',
    },
  ],
};

describe('external research handoffs', () => {
  it('renders a fixed-format decision memo pinned to the supplied PR head and digest', () => {
    const brief = renderResearchHandoff({
      repository: 'owner/site',
      pullRequest,
      reviewDigest: 'd'.repeat(64),
      item,
      packages,
      provenance: { status: 'verified', invalid: 0, missing: 0, reason: null },
    })?.join('\n');

    expect(brief).toContain('https://github.com/owner/site/pull/271');
    expect(brief).toContain('Immutable head: immutable-head');
    expect(brief).toContain(`Review digest: ${'d'.repeat(64)}`);
    expect(brief).toContain('direct update direct-package 1.0.0 to 2.0.0 (2 changed updates)');
    expect(brief).toContain('Perform read-only dependency research');
    expect(brief).toContain('Do not evaluate CI status');
    expect(brief).toContain('Return exactly the following Markdown sections and nothing else:');
    expect(brief).toContain('## Recommendation');
    expect(brief).toContain('Decision: `merge` or `hold for review`');
    expect(brief).toContain('## Decision evidence');
    expect(brief).toContain('## Repository impact');
    expect(brief).toContain('## Required action');
    expect(brief).toContain('## Remaining uncertainty');
    expect(brief).toContain('https://github.com/example/direct-package/releases/tag/v2.0.0');
    expect(brief).toContain('https://example.com/ignored-after-the-bound');
    expect(brief).not.toContain('https://example.com/also-ignored');
    expect(brief).not.toContain('https://github.com/example/nested-package/releases/tag/v2.0.0');
  });

  it('does not render an unpinned handoff', () => {
    expect(
      renderResearchHandoff({
        repository: 'owner/site',
        pullRequest,
        reviewDigest: '',
        item,
        packages,
        provenance: undefined,
      })
    ).toBeNull();
  });

  it('uses the current immutable head rather than stale caller state', () => {
    const brief = renderResearchHandoff({
      repository: 'owner/site',
      pullRequest: { ...pullRequest, headSha: 'new-head' },
      reviewDigest: 'e'.repeat(64),
      item,
      packages,
      provenance: undefined,
    })?.join('\n');

    expect(brief).toContain('Immutable head: new-head');
    expect(brief).not.toContain('Immutable head: immutable-head');
  });
});
