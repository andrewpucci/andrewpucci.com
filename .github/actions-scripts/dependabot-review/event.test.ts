import { describe, expect, it, vi } from 'vite-plus/test';
import { pullRequestNumber } from './event.mjs';

describe('pullRequestNumber', () => {
  it('reads the pull request associated with a completed CI workflow run', async () => {
    await expect(
      pullRequestNumber({
        workflow_run: { pull_requests: [{ number: 256 }] },
      })
    ).resolves.toBe(256);
  });

  it('rejects workflow runs that are not associated with a pull request', async () => {
    await expect(pullRequestNumber({ workflow_run: { pull_requests: [] } })).rejects.toThrow(
      'workflow_run is not associated with a pull request.'
    );
  });

  it('resolves a Dependabot pull request when workflow_run omits pull_requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json([
        {
          number: 258,
          head: { sha: 'dependabot-head' },
        },
      ])
    );

    await expect(
      pullRequestNumber(
        {
          workflow_run: {
            pull_requests: [],
            head_branch: 'dependabot/github_actions/github-actions-06333a3aa7',
            head_sha: 'dependabot-head',
          },
        },
        {
          repository: 'andrewpucci/andrewpucci.com',
          githubHeaders: { Authorization: 'Bearer test' },
          fetchLike: fetchMock,
        }
      )
    ).resolves.toBe(258);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        'pulls?state=open&head=andrewpucci%3Adependabot%2Fgithub_actions%2Fgithub-actions-06333a3aa7'
      ),
      { headers: { Authorization: 'Bearer test' } }
    );
  });
});
