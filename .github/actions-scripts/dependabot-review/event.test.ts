import { describe, expect, it } from 'vite-plus/test';
import { pullRequestForWorkflowRun, workflowRunHeadSha } from './event.mjs';

describe('workflow run pull request lookup', () => {
  it('selects the pull request associated with the completed workflow run head', () => {
    const headSha = 'dependabot-head';
    const pullRequest = { number: 258, head: { sha: headSha } };

    expect(workflowRunHeadSha({ workflow_run: { head_sha: headSha } })).toBe(headSha);
    expect(pullRequestForWorkflowRun([pullRequest], headSha)).toBe(pullRequest);
  });

  it('rejects workflow runs without a head SHA', () => {
    expect(() => workflowRunHeadSha({ workflow_run: {} })).toThrow(
      'workflow_run is missing its head SHA.'
    );
  });

  it('skips a completed run whose pull request has advanced to a newer head', () => {
    const pullRequest = { number: 258, head: { sha: 'newer-dependabot-head' } };

    expect(pullRequestForWorkflowRun([pullRequest], 'dependabot-head')).toBeNull();
  });
});
