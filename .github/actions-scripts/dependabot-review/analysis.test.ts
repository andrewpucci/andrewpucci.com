import { describe, expect, it, vi } from 'vite-plus/test';
import { analyze, responseFormatFor } from './analysis.mjs';

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
  it('forbids blockers and do-not-merge verdicts without verified findings', () => {
    const assessment =
      responseFormatFor(input).json_schema.schema.properties.decisionAssessments.items.properties;

    expect(assessment.verdict.enum).toEqual(['merge', 'merge_with_followups']);
    expect(assessment.blockers).toMatchObject({ type: 'array', maxItems: 0 });
  });

  it('continues to allow blockers when the review packet has verified findings', () => {
    const inputWithFinding = {
      ...input,
      packages: [
        {
          ...input.packages[0],
          findings: [
            {
              id: 'security-advisory',
              kind: 'security',
              sourceUrl: 'https://github.com/a/b/releases/tag/v2',
            },
          ],
        },
      ],
    };
    const assessment =
      responseFormatFor(inputWithFinding).json_schema.schema.properties.decisionAssessments.items
        .properties;

    expect(assessment.verdict.enum).toContain('do_not_merge');
    expect(assessment.blockers.items.properties.findingId.enum).toEqual(['security-advisory']);
  });

  it('tells Mistral the complete analysis contract', async () => {
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout');
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  verdict: 'merge',
                  summary: 'No compatibility concerns were identified.',
                  packageAssessments: [
                    {
                      name: 'example',
                      from: '1.0.0',
                      to: '2.0.0',
                      newFunctionality: [],
                    },
                  ],
                  blockers: [],
                  followups: [],
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
    expect(request.messages[0].content).toContain('decisionAssessments');
    expect(request.messages[0].content).toContain('remediationPrompt');
    expect(request.messages[0].content).toContain('explicitly non-blocking');
    expect(request.messages[0].content).toContain('merge_with_followups');
    expect(request.messages[0].content).toContain('decision-relevant upgrade question');
    expect(request.messages[0].content).toContain('decisionUnit IDs exactly once');
    expect(request.messages[0].content).toContain('never enumerate its transitive members');
    expect(request.messages[0].content).toContain('contextPath');
    expect(request.messages[0].content).toContain('policy verdict ceiling');
    expect(request.messages[0].content).toContain('newly introduced, opt-in capability');
    expect(request.messages[0].content).toContain('bug fixes');
    expect(request.messages[0].content).toContain(
      'generic dependency installation or workflow fact'
    );
    expect(request.messages[0].content).toContain('dependency manifest');
    expect(request.response_format).toMatchObject({
      type: 'json_schema',
      json_schema: {
        name: 'dependabot_review',
        strict: true,
        schema: expect.objectContaining({
          required: ['decisionAssessments'],
          properties: expect.objectContaining({
            decisionAssessments: expect.objectContaining({
              minItems: 1,
              maxItems: 1,
            }),
          }),
        }),
      },
    });
    expect(request.max_tokens).toBeGreaterThanOrEqual(4_000);
    expect(timeoutSpy).toHaveBeenCalledWith(120_000);
    timeoutSpy.mockRestore();
  });

  it('returns analysis_unavailable when Mistral returns malformed JSON', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ choices: [{ message: { content: 'nope' } }] }))
      );
    await expect(analyze(input, 'key', fetchMock)).resolves.toMatchObject({
      verdict: 'analysis_unavailable',
      reason: 'analysis_invalid_json',
    });
  });

  it('identifies an analysis truncated by Mistral', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ finish_reason: 'length', message: { content: '{' } }],
        })
      )
    );

    await expect(analyze(input, 'key', fetchMock)).resolves.toMatchObject({
      verdict: 'analysis_unavailable',
      summary: 'Mistral analysis was truncated; perform a manual dependency review.',
      reason: 'analysis_truncated',
    });
  });

  it('accepts a valid analysis wrapped in a Markdown JSON fence', async () => {
    const analysis = {
      verdict: 'merge',
      summary: 'No compatibility concerns were identified.',
      packageAssessments: [{ name: 'example', from: '1.0.0', to: '2.0.0', newFunctionality: [] }],
      blockers: [],
      followups: [],
      remediationPrompt: null,
    };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: `\`\`\`json\n${JSON.stringify(analysis)}\n\`\`\``,
              },
            },
          ],
        })
      )
    );

    await expect(analyze(input, 'key', fetchMock)).resolves.toMatchObject({
      verdict: 'merge',
    });
  });

  it('keeps a decision when an optional capability lacks a current use case', async () => {
    const inputWithUsage = {
      ...input,
      packages: [
        {
          ...input.packages[0],
          context: {
            status: 'available',
            facts: [
              {
                kind: 'package-usage',
                path: 'package.json',
                excerpt: 'The repository installs the package.',
              },
            ],
          },
        },
      ],
    };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  verdict: 'merge',
                  summary: 'No compatibility concerns were identified.',
                  packageAssessments: [
                    {
                      name: 'example',
                      from: '1.0.0',
                      to: '2.0.0',
                      newFunctionality: [
                        {
                          kind: 'new_capability',
                          feature: 'Add a type-safe configuration helper.',
                          sourceUrl: 'https://github.com/a/b/releases/tag/v2',
                          usefulness: 'consider_later',
                          action: 'Evaluate the helper in a new configuration file.',
                          contextPath: 'package.json',
                          rationale:
                            'No existing configuration file is visible; adoption can wait until one is created.',
                        },
                      ],
                    },
                  ],
                  blockers: [],
                  followups: [],
                  remediationPrompt: null,
                }),
              },
            },
          ],
        })
      )
    );

    await expect(analyze(inputWithUsage, 'key', fetchMock)).resolves.toMatchObject({
      verdict: 'merge',
      packageAssessments: [{ newFunctionality: [] }],
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
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
      reason: 'analysis_schema_decision_shape',
    });
  });

  it('reports a safe followup-contract category without retaining the model response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  verdict: 'merge',
                  summary: 'No compatibility concerns were identified.',
                  packageAssessments: [
                    {
                      name: 'example',
                      from: '1.0.0',
                      to: '2.0.0',
                      newFunctionality: [],
                    },
                  ],
                  blockers: [],
                  followups: [
                    {
                      description: 'This followup is not valid for a merge verdict.',
                      blocking: true,
                    },
                  ],
                  remediationPrompt: null,
                }),
              },
            },
          ],
        })
      )
    );

    await expect(analyze(input, 'key', fetchMock)).resolves.toMatchObject({
      verdict: 'analysis_unavailable',
      reason: 'analysis_schema_followup_contract',
    });
  });

  it('reports an unknown decision unit without retaining the model response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  decisionAssessments: [
                    {
                      decisionUnit: 'unknown-unit',
                      verdict: 'merge',
                      summary: 'No compatibility concerns were identified.',
                      newFunctionality: [],
                      blockers: [],
                      followups: [],
                      remediationPrompt: null,
                    },
                  ],
                }),
              },
            },
          ],
        })
      )
    );

    await expect(analyze(input, 'key', fetchMock)).resolves.toMatchObject({
      verdict: 'analysis_unavailable',
      reason: 'analysis_schema_unknown_package',
    });
  });

  it('adds a form-correction instruction on the bounded schema retry', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  verdict: 'merge',
                  summary: 'No compatibility concerns were identified.',
                  packageAssessments: [
                    {
                      name: 'example',
                      from: '1.0.0',
                      to: '2.0.0',
                      newFunctionality: [],
                    },
                  ],
                  blockers: [],
                  followups: [],
                  remediationPrompt: null,
                }),
              },
            },
          ],
        })
      )
    );

    await analyze(input, 'key', fetchMock, { retry: true });

    const request = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(request.messages[0].content).toContain('previous response could not be validated');
  });

  it('preserves the decision unit that owns a non-blocking follow-up', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  decisionAssessments: [
                    {
                      decisionUnit: 'unit-1',
                      verdict: 'merge_with_followups',
                      summary: 'One optional investigation remains.',
                      newFunctionality: [],
                      blockers: [],
                      followups: [
                        {
                          description: 'Investigate the opt-in integration before adopting it.',
                          blocking: false,
                        },
                      ],
                      remediationPrompt: null,
                    },
                  ],
                }),
              },
            },
          ],
        })
      )
    );

    await expect(analyze(input, 'key', fetchMock)).resolves.toMatchObject({
      verdict: 'merge_with_followups',
      followups: [
        {
          description: 'Investigate the opt-in integration before adopting it.',
          researchUnit: {
            group: { kind: 'standalone', anchor: null },
            members: [{ name: 'example', from: '1.0.0', to: '2.0.0' }],
            count: 1,
          },
        },
      ],
    });
  });

  it('expands one direct-unit assessment across all of its deterministic members', async () => {
    const groupedInput = {
      ...input,
      packages: [
        input.packages[0],
        {
          ...input.packages[0],
          name: 'transitive-example',
          dependencyType: 'transitive:production',
          evidence: { status: 'group_backed', reason: null },
          sources: [
            {
              ...input.packages[0].sources[0],
              url: 'https://github.com/a/b/releases/tag/transitive-example',
            },
          ],
        },
      ],
      coverage: {
        items: [
          {
            update: {
              name: 'example',
              from: '1.0.0',
              to: '2.0.0',
              dependencyType: 'direct:production',
            },
            group: {
              kind: 'direct',
              anchor: { name: 'example', from: '1.0.0', to: '2.0.0' },
            },
            lifecycle: {
              status: 'unchanged',
              metadata: 'not_needed',
              paths: [],
              changes: [],
              reason: null,
            },
            status: 'complete',
            reason: null,
          },
          {
            update: {
              name: 'transitive-example',
              from: '1.0.0',
              to: '2.0.0',
              dependencyType: 'transitive:production',
            },
            group: {
              kind: 'direct',
              anchor: { name: 'example', from: '1.0.0', to: '2.0.0' },
            },
            lifecycle: {
              status: 'unchanged',
              metadata: 'not_needed',
              paths: [],
              changes: [],
              reason: null,
            },
            status: 'complete',
            reason: null,
          },
        ],
      },
    };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  decisionAssessments: [
                    {
                      decisionUnit: 'unit-1',
                      verdict: 'merge',
                      summary: 'The direct update is compatible.',
                      newFunctionality: [],
                      blockers: [],
                      followups: [],
                      remediationPrompt: null,
                    },
                  ],
                }),
              },
            },
          ],
        })
      )
    );

    await expect(analyze(groupedInput, 'key', fetchMock)).resolves.toMatchObject({
      verdict: 'merge',
      packageAssessments: [
        { name: 'example', newFunctionality: [] },
        { name: 'transitive-example', newFunctionality: [] },
      ],
    });

    const request = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(request.messages[1].content).toContain('"memberCount":2');
    expect(request.messages[1].content).not.toContain('transitive-example');
    expect(JSON.stringify(request.response_format)).not.toContain('transitive-example');
  });
});
