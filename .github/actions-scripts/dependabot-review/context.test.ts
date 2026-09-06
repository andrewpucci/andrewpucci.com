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

  it('marks context partial when the aggregate fact cap is reached', async () => {
    const paths = Array.from({ length: 21 }, (_, index) => `src/example-${index}.ts`);

    const context = await collectRepositoryContext(
      [{ name: 'example-package', ecosystem: 'npm' }],
      { paths, readFile: async () => 'import examplePackage from "example-package";' }
    );

    expect(context[0]).toMatchObject({ status: 'partial' });
    expect(context[0].facts).toHaveLength(20);
  });
});
