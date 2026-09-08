import { describe, expect, it, vi } from 'vite-plus/test';
import { runDryReview } from './dry-run.mjs';

const itemId = '7wzb4oxgtxhukx75lewsbovlqq';

describe('Dependabot review dry run', () => {
  it('gets credentials from gh and 1Password, then prints the production Markdown', async () => {
    const runCommand = vi.fn(async (command: string, args: string[]) => {
      if (command === 'gh' && args[0] === 'auth') return { stdout: 'github-token\n', stderr: '' };
      if (command === 'gh' && args[0] === 'repo') return { stdout: 'example/site\n', stderr: '' };
      if (command === 'op') return { stdout: 'mistral-key\n', stderr: '' };
      throw new Error(`Unexpected command: ${command} ${args.join(' ')}`);
    });
    const buildReviewComment = vi.fn(async () => 'rendered production comment');
    const write = vi.fn();

    await runDryReview(['42'], { buildReviewComment, runCommand, write });

    expect(runCommand).toHaveBeenCalledWith('gh', ['auth', 'token']);
    expect(runCommand).toHaveBeenCalledWith('gh', [
      'repo',
      'view',
      '--json',
      'nameWithOwner',
      '--jq',
      '.nameWithOwner',
    ]);
    expect(runCommand).toHaveBeenCalledWith('op', [
      'item',
      'get',
      itemId,
      '--fields',
      'credential',
      '--reveal',
    ]);
    expect(buildReviewComment).toHaveBeenCalledWith({
      repository: 'example/site',
      number: 42,
      githubToken: 'github-token',
      mistralApiKey: 'mistral-key',
    });
    expect(write).toHaveBeenCalledWith('rendered production comment\n');
  });

  it('rejects invalid pull request numbers before acquiring credentials', async () => {
    const runCommand = vi.fn();

    await expect(
      runDryReview(['not-a-number'], {
        buildReviewComment: vi.fn(),
        runCommand,
        write: vi.fn(),
      })
    ).rejects.toThrow('Usage: npm run dependabot:review:dry-run -- <pull-request-number>');
    expect(runCommand).not.toHaveBeenCalled();
  });

  it('fails without printing when the pull request has no reviewable input', async () => {
    const runCommand = vi
      .fn()
      .mockResolvedValueOnce({ stdout: 'github-token\n', stderr: '' })
      .mockResolvedValueOnce({ stdout: 'example/site\n', stderr: '' })
      .mockResolvedValueOnce({ stdout: 'mistral-key\n', stderr: '' });
    const write = vi.fn();

    await expect(
      runDryReview(['42'], {
        buildReviewComment: vi.fn(async () => null),
        runCommand,
        write,
      })
    ).rejects.toThrow('Pull request #42 has no reviewable Dependabot dependency updates.');
    expect(write).not.toHaveBeenCalled();
  });
});
