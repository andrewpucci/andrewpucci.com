import { describe, expect, it } from 'vite-plus/test';
import { managedReviewMetadata, shouldSkipAnalysis } from './freshness.mjs';

const metadata = { headSha: 'head', reviewDigest: 'd'.repeat(64) };

describe('review freshness', () => {
  it('recognizes a current managed comment only when both immutable values match', () => {
    const current = {
      body: `<!-- dependabot-intelligent-review -->\n<!-- reviewed-head: head -->\n<!-- review-digest: ${'d'.repeat(64)} -->`,
    };

    expect(shouldSkipAnalysis(current, metadata)).toBe(true);
    expect(shouldSkipAnalysis(current, { ...metadata, headSha: 'new-head' })).toBe(false);
    expect(shouldSkipAnalysis(current, { ...metadata, reviewDigest: 'e'.repeat(64) })).toBe(false);
  });

  it('allows an explicit refresh and treats malformed markers as stale', () => {
    const malformed = { body: '<!-- reviewed-head: head -->\n<!-- review-digest: nope -->' };

    expect(managedReviewMetadata(malformed.body)).toEqual({ headSha: 'head', reviewDigest: null });
    expect(shouldSkipAnalysis(malformed, metadata)).toBe(false);
    expect(
      shouldSkipAnalysis(
        { body: `<!-- reviewed-head: head -->\n<!-- review-digest: ${'d'.repeat(64)} -->` },
        metadata,
        { refresh: true }
      )
    ).toBe(false);
  });
});
