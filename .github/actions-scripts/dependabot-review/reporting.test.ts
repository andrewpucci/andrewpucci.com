import { describe, expect, it } from 'vite-plus/test';
import { renderComment } from './reporting.mjs';

describe('renderComment', () => {
  it.each([
    ['merge', 'The evidence supports an advisory merge recommendation.'],
    [
      'merge_with_followups',
      'Merge is advisory only after recording the explicit non-blocking follow-ups.',
    ],
    ['do_not_merge', 'Do not merge until the documented blockers are remediated and validated.'],
    ['analysis_unavailable', 'No merge recommendation is available. Rerun the advisory review'],
  ])('renders a specific next action for %s', (verdict, action) => {
    const body = renderComment(
      {
        verdict,
        summary: 'An advisory decision was rendered.',
        packageAssessments: [],
        blockers: [],
        followups:
          verdict === 'merge_with_followups'
            ? [
                {
                  description: 'Record the optional configuration choice.',
                  blocking: false,
                },
              ]
            : [],
        remediationPrompt: null,
      },
      'head'
    );

    expect(body).toContain(`**Next action:** ${action}`);
    if (verdict === 'merge_with_followups') {
      expect(body).toContain('### Non-blocking follow-ups');
      expect(body).toContain('Record the optional configuration choice.');
    }
  });

  it('labels a repeated schema-invalid response with its safe failure category', () => {
    const body = renderComment(
      {
        verdict: 'decision_incomplete',
        summary: 'One decision unit awaits evidence.',
        decisionQueue: [
          {
            group: { kind: 'standalone', anchor: null },
            members: [{ name: 'example', from: '1.0.0', to: '2.0.0' }],
            count: 1,
            reason: 'analysis_schema_assessment_cardinality',
            failureCategory: 'analysis_schema_assessment_cardinality',
            action: 'Use the copyable research brief for this immutable decision unit.',
            lifecycle: [],
          },
        ],
        packageAssessments: [],
        blockers: [],
        remediationPrompt: null,
      },
      'immutable-head'
    );

    expect(body).toContain(
      'Mistral returned an incomplete set of decision assessments after one retry.'
    );
  });

  it('labels a repeated followup-contract failure without exposing model output', () => {
    const body = renderComment(
      {
        verdict: 'decision_incomplete',
        summary: 'One decision unit awaits evidence.',
        decisionQueue: [
          {
            group: { kind: 'standalone', anchor: null },
            members: [{ name: 'example', from: '1.0.0', to: '2.0.0' }],
            count: 1,
            reason: 'analysis_schema_followup_contract',
            failureCategory: 'analysis_schema_followup_contract',
            action: 'Use the copyable research brief for this immutable decision unit.',
            lifecycle: [],
          },
        ],
        packageAssessments: [],
        blockers: [],
        remediationPrompt: null,
      },
      'immutable-head'
    );

    expect(body).toContain(
      'Mistral follow-ups did not match its advisory verdict after one retry.'
    );
    expect(body).not.toContain('This followup is not valid');
  });

  it('labels an exhausted model budget without disclosing the model response', () => {
    const body = renderComment(
      {
        verdict: 'decision_incomplete',
        summary: 'One decision unit awaits evidence.',
        decisionQueue: [
          {
            group: { kind: 'standalone', anchor: null },
            members: [{ name: 'example', from: '1.0.0', to: '2.0.0' }],
            count: 1,
            reason: 'analysis_request_budget_exhausted',
            failureCategory: 'analysis_request_budget_exhausted',
            action: 'Rerun after increasing the model request budget.',
            lifecycle: [],
          },
        ],
        packageAssessments: [],
        blockers: [],
        remediationPrompt: null,
      },
      'immutable-head'
    );

    expect(body).toContain('The bounded Mistral request budget was exhausted before analysis.');
  });

  it('uses a safe label when a decision reason is not recognized', () => {
    const body = renderComment(
      {
        verdict: 'decision_incomplete',
        summary: 'One decision unit awaits evidence.',
        decisionQueue: [
          {
            group: { kind: 'standalone', anchor: null },
            members: [{ name: 'example', from: '1.0.0', to: '2.0.0' }],
            count: 1,
            reason: 'internal_reason_code',
            action: 'Resolve the recorded evidence gap.',
            lifecycle: [],
          },
        ],
        packageAssessments: [],
        blockers: [],
        remediationPrompt: null,
      },
      'head'
    );

    expect(body).toContain('The advisory system reported an unrecognized review condition.');
    expect(body).not.toContain('internal_reason_code');
  });

  it('labels a deterministic evidence-collection queue without exposing its internal category', () => {
    const body = renderComment(
      {
        verdict: 'decision_incomplete',
        summary: 'One decision unit awaits evidence.',
        decisionQueue: [
          {
            group: { kind: 'standalone', anchor: null },
            members: [{ name: 'example', from: '1.0.0', to: '2.0.0' }],
            count: 1,
            reason: 'policy_evidence_unavailable',
            action: 'Obtain upgrade evidence before deciding this immutable decision unit.',
            lifecycle: [],
          },
        ],
        packageAssessments: [],
        blockers: [],
        remediationPrompt: null,
      },
      'head'
    );

    expect(body).toContain('Upstream upgrade evidence could not be collected.');
    expect(body).not.toContain('policy_evidence_unavailable');
  });

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
            evidence: [
              {
                claim: 'Official migration.',
                sourceUrl: 'https://example.com',
              },
            ],
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
    expect(body).toContain('**Next action:** Do not merge');
  });

  it('renders every incomplete unit as a decision queue with pinned research briefs', () => {
    const body = renderComment(
      {
        verdict: 'decision_incomplete',
        summary: 'Two decision units await evidence.',
        decisionQueue: [
          {
            group: {
              kind: 'direct',
              anchor: { name: 'direct', from: '1.0.0', to: '2.0.0' },
            },
            members: [
              { name: 'direct', from: '1.0.0', to: '2.0.0' },
              { name: 'nested', from: '1.0.0', to: '2.0.0' },
            ],
            count: 2,
            reason: 'coverage_inputs_unavailable',
            action: 'Inspect direct evidence.',
            lifecycle: [],
          },
          {
            group: { kind: 'standalone', anchor: null },
            members: [{ name: 'standalone', from: '1.0.0', to: '2.0.0' }],
            count: 1,
            reason: 'analysis_unavailable',
            action: 'Rerun after correcting the transient failure.',
            lifecycle: [],
          },
        ],
        coverage: { complete: 0, pending: 1, unresolved: 2 },
        packageAssessments: [],
        blockers: [],
        followups: [],
        remediationPrompt: null,
      },
      {
        headSha: 'head',
        reviewDigest: 'd'.repeat(64),
        repository: 'owner/site',
        pullRequest: { number: 271, headSha: 'head' },
        packages: [
          {
            name: 'direct',
            from: '1.0.0',
            to: '2.0.0',
            sources: [{ url: 'https://example.com/direct' }],
          },
          {
            name: 'nested',
            from: '1.0.0',
            to: '2.0.0',
            sources: [{ url: 'https://example.com/nested' }],
          },
          {
            name: 'standalone',
            from: '1.0.0',
            to: '2.0.0',
            sources: [{ url: 'https://example.com/standalone' }],
          },
        ],
        provenance: {
          status: 'verified',
          invalid: 0,
          missing: 0,
          reason: null,
        },
      }
    );

    expect(body).toContain('<!-- dependabot-intelligent-review -->');
    expect(body).toContain('<!-- reviewed-head: head -->');
    expect(body).toContain(`<!-- review-digest: ${'d'.repeat(64)} -->`);
    expect(body).toContain('**Next action:** No merge recommendation is available.');
    expect(body).toContain('### Decision queue');
    expect(body).toContain('**Direct update direct 1.0.0 to 2.0.0** (2 changed updates)');
    expect(body).toContain('**Standalone update standalone 1.0.0 to 2.0.0** (1 changed update)');
    expect(body).not.toContain('and 1 other');
    expect(body).toContain('Copyable research brief: direct update');
    expect(body).toContain('Immutable head: head');
    expect(body).toContain('### Advisory provenance');
  });

  it('renders a pinned research prompt for a follow-up decision unit', () => {
    const body = renderComment(
      {
        verdict: 'merge_with_followups',
        summary: 'One follow-up needs an external investigation.',
        packageAssessments: [],
        blockers: [],
        followups: [
          {
            description:
              'Investigate whether the new opt-in integration fits the existing workflow.',
            blocking: false,
            researchUnit: {
              group: { kind: 'standalone', anchor: null },
              members: [{ name: 'example', from: '1.0.0', to: '2.0.0' }],
              count: 1,
            },
          },
        ],
        remediationPrompt: null,
      },
      {
        headSha: 'head',
        reviewDigest: 'd'.repeat(64),
        repository: 'owner/site',
        pullRequest: { number: 271, headSha: 'head' },
        packages: [
          {
            name: 'example',
            from: '1.0.0',
            to: '2.0.0',
            sources: [{ url: 'https://example.com/example/releases/tag/v2.0.0' }],
          },
        ],
        provenance: {
          status: 'verified',
          invalid: 0,
          missing: 0,
          reason: null,
        },
      }
    );

    expect(body).toContain('### Research prompts');
    expect(body).toContain('Copyable research prompt: standalone update example 1.0.0 to 2.0.0');
    expect(body).toContain(
      'Follow-up to investigate: Investigate whether the new opt-in integration fits the existing workflow.'
    );
    expect(body).toContain('Immutable head: head');
  });

  it('bounds research follow-ups globally and combines related actions per decision unit', () => {
    const names = [
      'first',
      'second',
      'third',
      'fourth',
      'fifth',
      'sixth',
      'seventh',
      'eighth',
      'ninth',
    ];
    const researchUnit = (name: string) => ({
      group: { kind: 'standalone', anchor: null },
      members: [{ name, from: '1.0.0', to: '2.0.0' }],
      count: 1,
    });
    const followups = names.map((name) => ({
      description: `${name} action.`,
      blocking: false,
      researchUnit: researchUnit(name),
    }));
    followups.splice(1, 0, {
      description: 'first related action.',
      blocking: false,
      researchUnit: researchUnit('first'),
    });

    const body = renderComment(
      {
        verdict: 'merge_with_followups',
        summary: 'Several focused investigations remain.',
        packageAssessments: [],
        blockers: [],
        followups,
        remediationPrompt: null,
      },
      {
        headSha: 'head',
        reviewDigest: 'd'.repeat(64),
        repository: 'owner/site',
        pullRequest: { number: 271, headSha: 'head' },
        packages: names.map((name) => ({
          name,
          from: '1.0.0',
          to: '2.0.0',
          sources: [{ url: `https://example.com/${name}` }],
        })),
      }
    );

    expect(body).toContain('**Standalone update first 1.0.0 to 2.0.0:** first action.');
    expect(body).toContain('first related action.');
    expect(body).not.toContain('ninth action.');
    expect(body.match(/<summary>Copyable research prompt:/g)).toHaveLength(8);
    expect(body).toContain('1 additional decision unit with non-blocking follow-ups is not shown.');
  });

  it('keeps the decision queue below GitHub limits and counts every omitted unit', () => {
    const count = 100;
    const body = renderComment(
      {
        verdict: 'decision_incomplete',
        summary: 'Many decision units await evidence.',
        decisionQueue: Array.from({ length: count }, (_, index) => ({
          group: { kind: 'standalone', anchor: null },
          members: [{ name: `package-${index}`, from: '1.0.0', to: '2.0.0' }],
          count: 1,
          reason: 'analysis_unavailable',
          action: 'x'.repeat(600),
          lifecycle: [],
        })),
        packageAssessments: [],
        blockers: [],
        followups: [],
        remediationPrompt: null,
      },
      'head'
    );

    const omitted = /([0-9]+) additional decision units are not shown\./.exec(body);
    const shown = [...body.matchAll(/Standalone update package-[0-9]+ 1\.0\.0 to 2\.0\.0/g)].length;

    expect(body.length).toBeLessThanOrEqual(50_000);
    expect(omitted).not.toBeNull();
    expect(shown + Number(omitted?.[1])).toBe(count);
    expect(body).toContain(
      'No merge recommendation is available until every decision unit is resolved.'
    );
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

  it('groups visible adoption opportunities and collapses irrelevant capabilities', () => {
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
                action: 'Enable the new option.',
                contextPath: 'src/config.ts',
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

    expect(body).toContain('### New capabilities to adopt now');
    expect(body).toContain('**example-package:** Useful immediately');
    expect(body).toContain('Action: Enable the new option. (src/config.ts)');
    expect(body).toContain('### New capabilities to consider later');
    expect(body).toContain('**example-package:** Useful later');
    expect(body).toContain('<details>');
    expect(body).toContain('<summary>New capabilities not relevant here</summary>');
    expect(body).toContain('**example-package:** Not applicable');
  });

  it('keeps the decision and blockers intact when feature output exceeds GitHub limits', () => {
    const body = renderComment(
      {
        verdict: 'do_not_merge',
        summary: 'Evidence requires a migration follow-up.',
        packageAssessments: [
          {
            name: 'example-package',
            from: '1.0.0',
            to: '2.0.0',
            newFunctionality: [
              {
                feature: 'A very long feature description',
                usefulness: 'use_now',
                rationale: 'x'.repeat(50_000),
                sourceUrl: 'https://example.com/use-now',
                action: 'Enable the new option.',
                contextPath: 'src/config.ts',
              },
            ],
          },
        ],
        blockers: [
          {
            reason: 'Run codemod',
            impact: 'Upgrade incomplete.',
            evidence: [
              {
                claim: 'Official migration.',
                sourceUrl: 'https://example.com',
              },
            ],
            remediation: ['Run it.'],
            validation: ['npm test'],
          },
        ],
        remediationPrompt: null,
      },
      'head'
    );

    expect(body.length).toBeLessThanOrEqual(50_000);
    expect(body).toContain('**Advisory verdict:** do not merge');
    expect(body).toContain('### Reasons not to merge');
    expect(body).toContain('Reviewed head: `head`.');
  });

  it('keeps critical blocker lines when their combined output exceeds GitHub limits', () => {
    const body = renderComment(
      {
        verdict: 'do_not_merge',
        summary: 'Several migration requirements need review.',
        packageAssessments: [],
        blockers: Array.from({ length: 20 }, (_, index) => ({
          reason: `Blocker ${index}`,
          impact: 'x'.repeat(3_900),
          evidence: [],
          remediation: [],
          validation: [],
        })),
        remediationPrompt: null,
      },
      'head'
    );

    expect(body.length).toBeLessThanOrEqual(50_000);
    expect(body).toContain('### Reasons not to merge');
    expect(body).toContain('**Blocker 0:**');
    expect(body).toContain('Additional lower-priority findings were omitted');
    expect(body).not.toContain('**Blocker 19:**');
    expect(body).toContain('Reviewed head: `head`.');
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
      body.indexOf('### New capabilities to consider later')
    );
  });

  it('does not render follow-ups when the final verdict is not merge_with_followups', () => {
    const body = renderComment(
      {
        verdict: 'decision_incomplete',
        summary: 'One decision unit still needs evidence.',
        packageAssessments: [],
        blockers: [],
        followups: [
          {
            description: 'Do not show this partial-result follow-up.',
            blocking: false,
          },
        ],
        remediationPrompt: null,
      },
      'head'
    );

    expect(body).not.toContain('### Non-blocking follow-ups');
    expect(body).not.toContain('Do not show this partial-result follow-up.');
  });
});
