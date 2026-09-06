import { describe, expect, it, vi } from 'vite-plus/test';
import { collectRepositoryContext } from './context.mjs';

describe('collectRepositoryContext', () => {
  it('associates an action with trusted workflow configuration', async () => {
    const readFile = vi.fn(async (path: string) => {
      if (path === '.github/workflows/ci.yml')
        return `- uses: actions/setup-node@v4\n  with:\n    node-version: 24`;
      throw new Error(`Unexpected path: ${path}`);
    });

    await expect(
      collectRepositoryContext([{ name: 'actions/setup-node', ecosystem: 'actions' }], {
        paths: ['.github/workflows/ci.yml', '.env'],
        readFile,
      })
    ).resolves.toEqual([
      {
        name: 'actions/setup-node',
        status: 'available',
        facts: [
          {
            kind: 'workflow-action',
            path: '.github/workflows/ci.yml',
            excerpt: 'uses: actions/setup-node@v4\n  with:\n    node-version: 24',
          },
        ],
      },
    ]);
    expect(readFile).toHaveBeenCalledTimes(1);
  });
});
