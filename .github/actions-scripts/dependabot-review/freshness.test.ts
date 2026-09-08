import { describe, expect, it } from 'vite-plus/test';
import { managedReviewMetadata, shouldSkipAnalysis, shouldSkipCurrentHead } from './freshness.mjs';

const metadata = { headSha: 'head', reviewDigest: 'd'.repeat(64) };

describe('review freshness', () => {
  it('recognizes a current managed comment by its immutable head and validated digest marker', () => {
    const current = {
      body: `<!-- dependabot-intelligent-review -->\n<!-- reviewed-head: head -->\n<!-- review-digest: ${'d'.repeat(64)} -->`,
    };

    expect(shouldSkipAnalysis(current, metadata)).toBe(true);
    expect(shouldSkipAnalysis(current, { ...metadata, headSha: 'new-head' })).toBe(false);
    expect(shouldSkipAnalysis(current, { ...metadata, reviewDigest: 'e'.repeat(64) })).toBe(true);
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

  it('recognizes the current immutable event head without constructing a review packet', () => {
    const current = {
      body: `<!-- dependabot-intelligent-review -->\n<!-- reviewed-head: head -->\n<!-- review-digest: ${'d'.repeat(64)} -->`,
    };

    expect(shouldSkipCurrentHead(current, 'head')).toBe(true);
    expect(shouldSkipCurrentHead(current, 'different-head')).toBe(false);
    expect(shouldSkipCurrentHead(current, 'head', { refresh: true })).toBe(false);
    expect(shouldSkipCurrentHead(current, '')).toBe(false);
  });
});
