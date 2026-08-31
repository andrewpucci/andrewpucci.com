import { describe, expect, it, vi } from 'vite-plus/test';
import { analyze } from './analysis.mjs';

const input = {
  pullRequest: { number: 1, baseSha: 'base', headSha: 'head' },
  packages: [
    {
      name: 'example',
      from: '1.0.0',
      to: '2.0.0',
      dependencyType: 'direct:production',
      findings: [],
      sources: [
        {
          kind: 'release-notes',
          url: 'https://github.com/a/b/releases/tag/v2',
          title: 'v2',
          excerpt: 'Feature.',
        },
      ],
    },
  ],
};

describe('analyze', () => {
  it('returns analysis_unavailable when Mistral returns malformed JSON', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ choices: [{ message: { content: 'nope' } }] }))
      );
    await expect(analyze(input, 'key', fetchMock)).resolves.toMatchObject({
      verdict: 'analysis_unavailable',
    });
  });
});
