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
  it('tells Mistral the complete analysis contract', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  verdict: 'merge',
                  summary: 'No compatibility concerns were identified.',
                  packageAssessments: [],
                  blockers: [],
                  remediationPrompt: null,
                }),
              },
            },
          ],
        })
      )
    );

    await analyze(input, 'key', fetchMock);

    const request = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(request.messages[0].content).toContain('packageAssessments');
    expect(request.messages[0].content).toContain('remediationPrompt');
    expect(request.messages[0].content).toContain('merge_with_followups');
    expect(request.messages[0].content).toContain('name every reviewed package');
  });

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

  it('identifies a response that does not satisfy the review schema', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify({ verdict: 'merge' }) } }],
        })
      )
    );

    await expect(analyze(input, 'key', fetchMock)).resolves.toMatchObject({
      verdict: 'analysis_unavailable',
      summary: 'Mistral returned JSON that did not match the required review schema.',
    });
  });
});
