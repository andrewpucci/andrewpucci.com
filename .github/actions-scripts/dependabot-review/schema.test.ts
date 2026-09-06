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

describe('review contracts', () => {
  it('accepts a bounded, provenance-tagged input packet', () => {
    expect(parseReviewInput(reviewInput)).toEqual(reviewInput);
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
