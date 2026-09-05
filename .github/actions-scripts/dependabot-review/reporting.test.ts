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
});
