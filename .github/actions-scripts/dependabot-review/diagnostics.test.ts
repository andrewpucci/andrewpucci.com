import { describe, expect, it, vi } from 'vite-plus/test';
import {
  emitGithubRequestDiagnostic,
  emitReviewDiagnostic,
  githubRequestDiagnostic,
  reviewDiagnostic,
} from './diagnostics.mjs';

const metadata = {
  headSha: 'head',
  reviewDigest: 'd'.repeat(64),
  modelVersion: 'mistral-medium-latest',
  promptVersion: 'dependabot-review-v2',
  coverage: { complete: 3, pending: 1, unresolved: 2 },
};

describe('review diagnostics', () => {
  it('emits only bounded run metadata and a failure category', () => {
    const diagnostic = reviewDiagnostic(metadata, 'analysis_unavailable');

    expect(JSON.parse(diagnostic)).toEqual({
      ...metadata,
      failureCategory: 'analysis_unavailable',
    });
    expect(diagnostic).not.toContain('source excerpt');
    expect(diagnostic).not.toContain('credential');
  });

  it('writes one prefixed diagnostic line', () => {
    const log = vi.fn();

    emitReviewDiagnostic(metadata, 'duplicate_review', log);

    expect(log).toHaveBeenCalledWith(expect.stringContaining('Dependabot review diagnostic:'));
  });

  it('emits bounded GitHub request-limit diagnostics without response content', () => {
    const diagnostic = githubRequestDiagnostic(
      { status: 429, resource: 'core', remaining: 0, reset: 123, retryAfter: 60 },
      { headSha: 'head', reviewDigest: 'd'.repeat(64) }
    );

    expect(JSON.parse(diagnostic)).toEqual({
      headSha: 'head',
      reviewDigest: 'd'.repeat(64),
      githubRequestLimit: {
        status: 429,
        resource: 'core',
        remaining: 0,
        reset: 123,
        retryAfter: 60,
      },
    });
    expect(diagnostic).not.toContain('rate limited response body');

    const log = vi.fn();
    emitGithubRequestDiagnostic({ status: 'request_budget_exhausted' }, { headSha: 'head' }, log);
    expect(log).toHaveBeenCalledWith(expect.stringContaining('GitHub request diagnostic:'));
  });
});
