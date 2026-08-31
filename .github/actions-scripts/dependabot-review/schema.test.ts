import { describe, expect, it } from 'vite-plus/test';
import { parseAnalysis, parseReviewInput } from './schema.mjs';

const source = {
  kind: 'release-notes',
  url: 'https://github.com/example/package/releases/tag/v2.0.0',
  title: 'v2.0.0',
  excerpt: 'Adds a documented feature.',
};

const reviewInput = {
  pullRequest: { number: 42, baseSha: 'base', headSha: 'head' },
  packages: [
    {
      name: 'example',
      from: '1.0.0',
      to: '2.0.0',
      dependencyType: 'direct:production',
      sources: [source],
      findings: [],
    },
  ],
};

describe('review contracts', () => {
  it('accepts a bounded, provenance-tagged input packet', () => {
    expect(parseReviewInput(reviewInput)).toEqual(reviewInput);
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

  it('rejects a blocking verdict without a verified input finding', () => {
    expect(() =>
      parseAnalysis(
        {
          verdict: 'do_not_merge',
          summary: 'A migration is required.',
          packageAssessments: [],
          blockers: [
            {
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
});
