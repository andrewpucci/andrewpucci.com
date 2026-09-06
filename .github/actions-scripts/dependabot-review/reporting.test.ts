import { describe, expect, it } from 'vite-plus/test';
import { renderComment } from './reporting.mjs';

describe('renderComment', () => {
  it('renders a blocking remediation report as advisory Markdown', () => {
    const body = renderComment(
      {
        verdict: 'do_not_merge',
        summary: 'Migration required.',
        packageAssessments: [],
        blockers: [
          {
            reason: 'Run codemod',
            impact: 'Upgrade incomplete.',
            evidence: [{ claim: 'Official migration.', sourceUrl: 'https://example.com' }],
            remediation: ['Run it.'],
            validation: ['npm test'],
          },
        ],
        remediationPrompt: 'Run the codemod.',
      },
      'head'
    );
    expect(body).toContain('Advisory verdict');
    expect(body).toContain('Remediation prompt');
  });

  it('escapes fence delimiters inside a remediation prompt', () => {
    const body = renderComment(
      {
        verdict: 'do_not_merge',
        summary: 'Migration required.',
        packageAssessments: [],
        blockers: [
          {
            reason: 'Run codemod',
            impact: 'Upgrade incomplete.',
            evidence: [],
            remediation: [],
            validation: [],
          },
        ],
        remediationPrompt: 'Run the migration.\n```sh\nnpm run migrate\n```',
      },
      'head'
    );

    expect(body).toContain('``\\`sh');
    expect(body).toContain('``\\`\n```');
  });

  it('groups visible features and collapses irrelevant ones', () => {
    const body = renderComment(
      {
        verdict: 'merge',
        summary: 'Reviewed dependency updates.',
        packageAssessments: [
          {
            name: 'example-package',
            from: '1.0.0',
            to: '2.0.0',
            newFunctionality: [
              {
                feature: 'Useful immediately',
                usefulness: 'use_now',
                rationale: 'Use it in this repository today.',
                sourceUrl: 'https://example.com/use-now',
              },
              {
                feature: 'Useful later',
                usefulness: 'consider_later',
                rationale: 'Keep it in mind for later work.',
                sourceUrl: 'https://example.com/later',
              },
              {
                feature: 'Not applicable',
                usefulness: 'not_relevant',
                rationale: 'This repository does not use it.',
                sourceUrl: 'https://example.com/not-relevant',
              },
            ],
          },
        ],
        blockers: [],
        remediationPrompt: null,
      },
      'head'
    );

    expect(body).toContain('### Use now');
    expect(body).toContain('**example-package:** Useful immediately');
    expect(body).toContain('### Consider later');
    expect(body).toContain('**example-package:** Useful later');
    expect(body).toContain('<details>');
    expect(body).toContain('<summary>Not relevant</summary>');
    expect(body).toContain('**example-package:** Not applicable');
  });

  it('renders blockers before enabled functionality', () => {
    const body = renderComment(
      {
        verdict: 'do_not_merge',
        summary: 'Migration required.',
        packageAssessments: [
          {
            name: 'example-package',
            from: '1.0.0',
            to: '2.0.0',
            newFunctionality: [
              {
                feature: 'Useful later',
                usefulness: 'consider_later',
                rationale: 'Keep it in mind for later work.',
                sourceUrl: 'https://example.com/later',
              },
            ],
          },
        ],
        blockers: [
          {
            reason: 'Run codemod',
            impact: 'Upgrade incomplete.',
            evidence: [],
            remediation: [],
            validation: [],
          },
        ],
        remediationPrompt: null,
      },
      'head'
    );

    expect(body.indexOf('### Reasons not to merge')).toBeLessThan(
      body.indexOf('### Consider later')
    );
  });
});
