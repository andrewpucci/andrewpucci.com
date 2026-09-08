import { describe, expect, it } from 'vite-plus/test';
import { parseAnalysis, parsePolicy, parseReviewInput } from './schema.mjs';

const source = {
  kind: 'release-notes',
  url: 'https://github.com/example/package/releases/tag/v2.0.0',
  title: 'v2.0.0',
  excerpt: 'Adds a documented feature.',
  range: { from: '1.0.0', to: '2.0.0' },
};

const reviewInput = {
  pullRequest: { number: 42, baseSha: 'base', headSha: 'head' },
  packages: [
    {
      name: 'example',
      from: '1.0.0',
      to: '2.0.0',
      dependencyType: 'direct:production',
      license: null,
      evidence: { status: 'available', reason: null },
      context: { status: 'unavailable', facts: [] },
      sources: [source],
      findings: [],
    },
  ],
};

const unavailableProvenance = {
  status: 'unavailable',
  invalid: 0,
  missing: 0,
  reason: 'The npm verifier did not return usable evidence.',
};

describe('review contracts', () => {
  const emptyFollowups = { followups: [] };
  it('accepts a bounded, provenance-tagged input packet', () => {
    expect(parseReviewInput(reviewInput)).toEqual(reviewInput);
  });

  it('accepts only bounded advisory provenance evidence', () => {
    const input = { ...reviewInput, provenance: unavailableProvenance };

    expect(parseReviewInput(input)).toEqual(input);
  });

  it('validates complete coverage once for every package while preserving its direct group', () => {
    const nested = {
      ...reviewInput.packages[0],
      name: 'nested',
      dependencyType: 'transitive',
      sources: [{ ...source, url: 'https://github.com/example/nested/releases/tag/v2.0.0' }],
    };
    const input = {
      ...reviewInput,
      packages: [reviewInput.packages[0], nested],
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
              changes: [],
              paths: ['node_modules/example'],
              reason: null,
            },
            status: 'complete',
            reason: null,
          },
          {
            update: { name: 'nested', from: '1.0.0', to: '2.0.0', dependencyType: 'transitive' },
            group: {
              kind: 'direct',
              anchor: { name: 'example', from: '1.0.0', to: '2.0.0' },
            },
            lifecycle: {
              status: 'unchanged',
              metadata: 'not_needed',
              changes: [],
              paths: ['node_modules/example/node_modules/nested'],
              reason: null,
            },
            status: 'complete',
            reason: null,
          },
        ],
      },
    };

    expect(parseReviewInput(input)).toEqual(input);
  });

  it('rejects coverage that omits an input package', () => {
    expect(() =>
      parseReviewInput({
        ...reviewInput,
        coverage: { items: [] },
      })
    ).toThrow(/coverage/i);
  });

  it.each([
    [{ ...unavailableProvenance, status: 'unknown' }],
    [{ ...unavailableProvenance, invalid: 1 }],
    [{ ...unavailableProvenance, reason: null }],
    [{ ...unavailableProvenance, reason: 'x'.repeat(241) }],
    [{ ...unavailableProvenance, rawOutput: 'must not cross this boundary' }],
  ])('rejects malformed or unbounded provenance evidence', (provenance) => {
    expect(() => parseReviewInput({ ...reviewInput, provenance })).toThrow(/provenance/i);
  });

  it('rejects a vulnerability with an unsupported severity', () => {
    const inputWithVulnerability = {
      ...reviewInput,
      packages: [
        {
          ...reviewInput.packages[0],
          findings: [
            {
              id: 'example:vulnerability',
              kind: 'vulnerability',
              reason: 'GitHub reported a vulnerability.',
              sourceUrl: source.url,
              severity: 'urgent',
              remediation: ['Update the package.'],
              validation: ['npm test'],
            },
          ],
        },
      ],
    };

    expect(() => parseReviewInput(inputWithVulnerability)).toThrow(/severity/i);
  });

  it('rejects a policy finding that is not attributable to the input packet', () => {
    expect(() =>
      parsePolicy(
        {
          verdictCeiling: 'do_not_merge',
          findings: [
            {
              package: { name: 'example', from: '1.0.0', to: '2.0.0' },
              findingId: 'example:vulnerability',
              kind: 'vulnerability',
              sourceUrl: 'https://untrusted.example/advisory',
              severity: 'critical',
              verdict: 'do_not_merge',
              reason: 'A critical vulnerability affects the target version.',
              remediation: ['Update the package.'],
              validation: ['npm test'],
            },
          ],
        },
        {
          ...reviewInput,
          packages: [
            {
              ...reviewInput.packages[0],
              findings: [
                {
                  id: 'example:vulnerability',
                  kind: 'vulnerability',
                  reason: 'GitHub reported a vulnerability.',
                  sourceUrl: source.url,
                  severity: 'critical',
                  remediation: ['Update the package.'],
                  validation: ['npm test'],
                },
              ],
            },
          ],
        }
      )
    ).toThrow(/source URL/i);
  });

  it('rejects analysis citations not present in the input packet', () => {
    expect(() =>
      parseAnalysis(
        {
          verdict: 'merge_with_followups',
          followups: [
            { description: 'Confirm the optional configuration later.', blocking: false },
          ],
          summary: 'Consider the new feature.',
          packageAssessments: [
            {
              name: 'example',
              from: '1.0.0',
              to: '2.0.0',
              newFunctionality: [
                {
                  feature: 'Documented feature',
                  sourceUrl: 'https://untrusted.example/feature',
                  usefulness: 'consider_later',
                  rationale: 'Potentially useful.',
                },
              ],
            },
          ],
          blockers: [],
          remediationPrompt: null,
        },
        reviewInput
      )
    ).toThrow(/unknown evidence URL/i);
  });

  it('requires explicit, non-blocking followups for a followup verdict', () => {
    const analysis = {
      verdict: 'merge_with_followups',
      summary: 'Confirm an optional setting after merge.',
      packageAssessments: [{ name: 'example', from: '1.0.0', to: '2.0.0', newFunctionality: [] }],
      blockers: [],
      remediationPrompt: null,
    };

    expect(() => parseAnalysis(analysis, reviewInput)).toThrow(/followups/i);
    expect(
      parseAnalysis(
        {
          ...analysis,
          followups: [
            { description: 'Confirm the optional setting after merge.', blocking: false },
          ],
        },
        reviewInput
      )
    ).toMatchObject({ verdict: 'merge_with_followups', followups: [{ blocking: false }] });
  });

  it('rejects a model verdict that exceeds the policy ceiling', () => {
    const policyInput = {
      ...reviewInput,
      packages: [
        {
          ...reviewInput.packages[0],
          evidence: { status: 'partial', reason: 'Only partial release notes were available.' },
        },
      ],
      policy: {
        verdictCeiling: 'merge_with_followups',
        findings: [
          {
            package: { name: 'example', from: '1.0.0', to: '2.0.0' },
            findingId: null,
            kind: 'evidence-incomplete',
            sourceUrl: null,
            severity: null,
            verdict: 'merge_with_followups',
            reason: 'Upstream evidence is incomplete.',
            remediation: ['Review the upstream upgrade evidence before merging.'],
            validation: ['Confirm the upgrade range against upstream release notes.'],
          },
        ],
      },
    };

    expect(() =>
      parseAnalysis(
        {
          verdict: 'merge',
          ...emptyFollowups,
          summary: 'The update is ready.',
          packageAssessments: [
            { name: 'example', from: '1.0.0', to: '2.0.0', newFunctionality: [] },
          ],
          blockers: [],
          remediationPrompt: null,
        },
        policyInput
      )
    ).toThrow(/policy/i);
  });

  it('rejects use_now without a matching trusted-context fact', () => {
    const contextInput = {
      ...reviewInput,
      packages: [
        {
          ...reviewInput.packages[0],
          context: {
            status: 'available',
            facts: [
              {
                kind: 'package-usage',
                path: 'package.json',
                excerpt: '"example": "^2.0.0"',
              },
            ],
          },
        },
      ],
    };

    expect(() =>
      parseAnalysis(
        {
          verdict: 'merge',
          ...emptyFollowups,
          summary: 'The update is ready.',
          packageAssessments: [
            {
              name: 'example',
              from: '1.0.0',
              to: '2.0.0',
              newFunctionality: [
                {
                  feature: 'Enable the documented feature.',
                  sourceUrl: source.url,
                  usefulness: 'use_now',
                  action: 'Enable the feature in the package configuration.',
                  contextPath: 'src/unrelated.ts',
                  rationale: 'It is useful.',
                },
              ],
            },
          ],
          blockers: [],
          remediationPrompt: null,
        },
        contextInput
      )
    ).toThrow(/context/i);
  });

  it('rejects duplicate package assessments', () => {
    const assessment = {
      name: 'example',
      from: '1.0.0',
      to: '2.0.0',
      newFunctionality: [],
    };

    expect(() =>
      parseAnalysis(
        {
          verdict: 'merge',
          ...emptyFollowups,
          summary: 'The update is ready.',
          packageAssessments: [assessment, assessment],
          blockers: [],
          remediationPrompt: null,
        },
        reviewInput
      )
    ).toThrow(/exactly one package assessment/i);
  });

  it('rejects a blocking verdict without a verified input finding', () => {
    expect(() =>
      parseAnalysis(
        {
          verdict: 'do_not_merge',
          ...emptyFollowups,
          summary: 'A migration is required.',
          packageAssessments: [
            { name: 'example', from: '1.0.0', to: '2.0.0', newFunctionality: [] },
          ],
          blockers: [
            {
              findingId: 'missing-finding',
              reason: 'Run the codemod.',
              impact: 'The upgrade is incomplete.',
              evidence: [{ claim: 'The codemod is documented.', sourceUrl: source.url }],
              remediation: ['Run the official codemod.'],
              validation: ['npm test'],
            },
          ],
          remediationPrompt: 'Run the codemod and validate the resulting diff.',
        },
        reviewInput
      )
    ).toThrow(/verified input finding/i);
  });

  it('rejects a blocker that does not identify a matching verified finding', () => {
    const inputWithFinding = {
      ...reviewInput,
      packages: [
        {
          ...reviewInput.packages[0],
          findings: [
            {
              id: 'example:applicable-codemod',
              kind: 'applicable-codemod',
              reason: 'Run the codemod.',
              sourceUrl: source.url,
              remediation: ['npx example-codemod migrate'],
              validation: ['npm test'],
            },
          ],
        },
      ],
    };

    expect(() =>
      parseAnalysis(
        {
          verdict: 'do_not_merge',
          ...emptyFollowups,
          summary: 'A migration is required.',
          packageAssessments: [
            { name: 'example', from: '1.0.0', to: '2.0.0', newFunctionality: [] },
          ],
          blockers: [
            {
              findingId: 'different-finding',
              reason: 'Run the codemod.',
              impact: 'The upgrade is incomplete.',
              evidence: [{ claim: 'The codemod is documented.', sourceUrl: source.url }],
              remediation: ['Run the official codemod.'],
              validation: ['npm test'],
            },
          ],
          remediationPrompt: 'Run the codemod and validate the resulting diff.',
        },
        inputWithFinding
      )
    ).toThrow(/verified input finding/i);
  });

  it('accepts a blocker that cites its matching verified finding', () => {
    const inputWithFinding = {
      ...reviewInput,
      packages: [
        {
          ...reviewInput.packages[0],
          findings: [
            {
              id: 'example:applicable-codemod',
              kind: 'applicable-codemod',
              reason: 'Run the codemod.',
              sourceUrl: source.url,
              remediation: ['npx example-codemod migrate'],
              validation: ['npm test'],
            },
          ],
        },
      ],
    };

    expect(
      parseAnalysis(
        {
          verdict: 'do_not_merge',
          ...emptyFollowups,
          summary: 'A migration is required.',
          packageAssessments: [
            { name: 'example', from: '1.0.0', to: '2.0.0', newFunctionality: [] },
          ],
          blockers: [
            {
              findingId: 'example:applicable-codemod',
              reason: 'Run the codemod.',
              impact: 'The upgrade is incomplete.',
              evidence: [{ claim: 'The codemod is documented.', sourceUrl: source.url }],
              remediation: ['Run the official codemod.'],
              validation: ['npm test'],
            },
          ],
          remediationPrompt: 'Run the codemod and validate the resulting diff.',
        },
        inputWithFinding
      )
    ).toMatchObject({ verdict: 'do_not_merge' });
  });
});
