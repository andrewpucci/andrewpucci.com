import { describe, expect, it } from 'vite-plus/test';
import { canonicalReviewPacket, createReviewMetadata } from './review-metadata.mjs';

const input = {
  pullRequest: { number: 271, baseSha: 'base', headSha: 'head' },
  packages: [
    {
      name: 'example',
      from: '1.0.0',
      to: '2.0.0',
      evidence: { status: 'available', reason: null },
      sources: [{ url: 'https://example.com/release', excerpt: 'Unexposed source text.' }],
    },
  ],
  coverage: {
    items: [
      {
        update: { name: 'example', from: '1.0.0', to: '2.0.0' },
        group: { kind: 'standalone', anchor: null },
        lifecycle: { status: 'unchanged', metadata: 'not_needed', paths: [], changes: [] },
        status: 'complete',
        reason: null,
      },
    ],
  },
};
const policy = { verdictCeiling: 'merge', findings: [] };

describe('review metadata', () => {
  it('canonicalizes validated input and binds the digest to the immutable head', () => {
    const metadata = createReviewMetadata(input, policy, { repository: 'owner/site' });
    const newHead = createReviewMetadata(
      { ...input, pullRequest: { ...input.pullRequest, headSha: 'new-head' } },
      policy,
      { repository: 'owner/site' }
    );

    expect(metadata).toMatchObject({
      headSha: 'head',
      repository: 'owner/site',
      coverage: { complete: 1, pending: 0, unresolved: 0 },
    });
    expect(metadata.reviewDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(newHead.reviewDigest).not.toBe(metadata.reviewDigest);
    expect(JSON.stringify(metadata)).not.toContain('Unexposed source text.');
  });

  it('produces the same canonical form independent of object key order', () => {
    const reordered = {
      coverage: input.coverage,
      packages: input.packages,
      pullRequest: input.pullRequest,
    };

    expect(canonicalReviewPacket(reordered, policy)).toEqual(canonicalReviewPacket(input, policy));
  });
});
