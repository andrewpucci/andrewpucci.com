/// <reference types="node" />

import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vite-plus/test';
import { runDryReview } from './dry-run.mjs';

const itemId = '7wzb4oxgtxhukx75lewsbovlqq';
const execFileAsync = promisify(execFile);
const reviewInput = {
  packages: [{ name: 'example-package', dependencyType: 'direct:production' }],
};

describe('Dependabot review dry run', () => {
  it('collects review input before retrieving the Mistral credential', async () => {
    const runCommand = vi.fn(async (command: string, args: string[]) => {
      if (command === 'gh' && args[0] === 'auth') return { stdout: 'github-token\n', stderr: '' };
      if (command === 'gh' && args[0] === 'repo') return { stdout: 'example/site\n', stderr: '' };
      if (command === 'op') return { stdout: 'mistral-key\n', stderr: '' };
      throw new Error(`Unexpected command: ${command} ${args.join(' ')}`);
    });
    const loadReviewInput = vi.fn(async () => reviewInput);
    const buildReviewCommentFromInput = vi.fn(async () => 'rendered production comment');
    const write = vi.fn();
    const writeStatus = vi.fn();

    await runDryReview(['42'], {
      buildReviewCommentFromInput,
      loadReviewInput: loadReviewInput as never,
      runCommand,
      write,
      writeStatus,
    });

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
    expect(loadReviewInput).toHaveBeenCalledWith({
      repository: 'example/site',
      number: 42,
      githubToken: 'github-token',
    });
    expect(buildReviewCommentFromInput).toHaveBeenCalledWith(reviewInput, 'mistral-key', {
      repository: 'example/site',
    });
    expect(write).toHaveBeenCalledWith('rendered production comment\n');
    expect(writeStatus).toHaveBeenCalledWith('Generated review for pull request #42 (28 bytes).\n');
  });

  it('rejects invalid pull request numbers before acquiring credentials', async () => {
    const runCommand = vi.fn();

    await expect(
      runDryReview(['not-a-number'], {
        buildReviewCommentFromInput: vi.fn(),
        loadReviewInput: vi.fn(),
        runCommand,
        write: vi.fn(),
      })
    ).rejects.toThrow(
      'Usage: npm run dependabot:review:dry-run -- <pull-request-number> [--preflight]'
    );
    expect(runCommand).not.toHaveBeenCalled();
  });

  it('does not retrieve the Mistral credential when no reviewable input exists', async () => {
    const runCommand = vi
      .fn()
      .mockResolvedValueOnce({ stdout: 'github-token\n', stderr: '' })
      .mockResolvedValueOnce({ stdout: 'example/site\n', stderr: '' });
    const write = vi.fn();

    await expect(
      runDryReview(['42'], {
        buildReviewCommentFromInput: vi.fn(),
        loadReviewInput: vi.fn(async () => null),
        runCommand,
        write,
      })
    ).rejects.toThrow('Pull request #42 has no reviewable Dependabot dependency updates.');
    expect(runCommand).not.toHaveBeenCalledWith('op', expect.anything());
    expect(write).not.toHaveBeenCalled();
  });

  it('reports reviewability without retrieving the Mistral credential in preflight mode', async () => {
    const runCommand = vi
      .fn()
      .mockResolvedValueOnce({ stdout: 'github-token\n', stderr: '' })
      .mockResolvedValueOnce({ stdout: 'example/site\n', stderr: '' });
    const write = vi.fn();

    await runDryReview(['42', '--preflight'], {
      buildReviewCommentFromInput: vi.fn(),
      loadReviewInput: vi.fn(async () => reviewInput) as never,
      runCommand,
      write,
    });

    expect(runCommand).not.toHaveBeenCalledWith('op', expect.anything());
    expect(write).toHaveBeenCalledWith(
      'Pull request #42 has 1 reviewable Dependabot dependency update (1 direct, 0 transitive).\n'
    );
  });

  it('flushes the generated Markdown and emits a receipt in a subprocess', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'dependabot-review-'));
    const runner = join(directory, 'dry-run.mjs');
    const dryRunModule = pathToFileURL(
      resolve(process.cwd(), '.github/actions-scripts/dependabot-review/dry-run.mjs')
    ).href;
    await writeFile(
      runner,
      `import { runDryReview } from ${JSON.stringify(dryRunModule)};
await runDryReview(['42'], {
  runCommand: async (command, args) => {
    if (command === 'gh' && args[0] === 'auth') return { stdout: 'github-token\\n' };
    if (command === 'gh' && args[0] === 'repo') return { stdout: 'example/site\\n' };
    if (command === 'op') return { stdout: 'mistral-key\\n' };
    throw new Error('Unexpected command');
  },
  loadReviewInput: async () => ({
    packages: [{ name: 'example-package', dependencyType: 'direct:production' }],
  }),
  buildReviewCommentFromInput: async () => 'rendered production comment',
});
`
    );

    try {
      await expect(
        execFileAsync(process.execPath, [runner], { encoding: 'utf8' })
      ).resolves.toMatchObject({
        stdout: 'rendered production comment\n',
        stderr: 'Generated review for pull request #42 (28 bytes).\n',
      });
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });
});
