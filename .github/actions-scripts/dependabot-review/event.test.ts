import { describe, expect, it } from 'vite-plus/test';
import { pullRequestNumber } from './event.mjs';

describe('pullRequestNumber', () => {
  it('reads the pull request associated with a completed CI workflow run', () => {
    expect(
      pullRequestNumber({
        workflow_run: { pull_requests: [{ number: 256 }] },
      })
    ).toBe(256);
  });

  it('rejects workflow runs that are not associated with a pull request', () => {
    expect(() => pullRequestNumber({ workflow_run: { pull_requests: [] } })).toThrow(
      'workflow_run is not associated with a pull request.'
    );
  });
});
