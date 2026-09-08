import { describe, expect, it } from 'vite-plus/test';
import { evaluatePolicy } from './policy.mjs';

type Severity = 'low' | 'moderate' | 'high' | 'critical' | null;
type Finding = {
  id: string;
  kind: 'vulnerability' | 'applicable-codemod' | 'incompatible-migration';
  reason: string;
  sourceUrl: string;
  severity?: Severity;
  remediation: string[];
  validation: string[];
};
type ReviewOptions = {
  evidenceStatus?: 'available' | 'partial' | 'unavailable';
  findings?: Finding[];
  license?: string | null;
};

const source = {
  kind: 'github-advisory',
  url: 'https://github.com/advisories/GHSA-example',
  title: 'GHSA-example',
  excerpt: 'Example advisory.',
  range: { from: '1.0.0', to: '2.0.0' },
};

function reviewInput({
  evidenceStatus = 'available',
  findings = [],
  license = null,
}: ReviewOptions = {}) {
  return {
    pullRequest: { number: 42, baseSha: 'base', headSha: 'head' },
    packages: [
      {
        name: 'example',
        from: '1.0.0',
        to: '2.0.0',
        dependencyType: 'direct:production',
        license,
        evidence: { status: evidenceStatus, reason: null },
        context: { status: 'available', facts: [] },
        sources: [source],
        findings,
      },
    ],
  };
}

function vulnerability(severity: Severity): Finding {
  return {
    id: `example:vulnerability:${severity ?? 'unscored'}`,
    kind: 'vulnerability',
    reason: 'GitHub reported a vulnerability in example.',
    sourceUrl: source.url,
    severity,
    remediation: ['Update the package.'],
    validation: ['npm test'],
  };
}

function migration(kind: 'applicable-codemod' | 'incompatible-migration'): Finding {
  return {
    id: `example:${kind}`,
    kind,
    reason: 'The upstream migration applies to this upgrade.',
    sourceUrl: source.url,
    remediation: ['Apply the documented migration.'],
    validation: ['npm test'],
  };
}

describe('Dependabot review policy', () => {
  it.each(['partial', 'unavailable'] as const)(
    'caps %s evidence at merge_with_followups',
    (status) => {
      expect(evaluatePolicy(reviewInput({ evidenceStatus: status }))).toMatchObject({
        verdictCeiling: 'merge_with_followups',
        findings: [
          {
            kind: 'evidence-incomplete',
            findingId: null,
            sourceUrl: null,
            verdict: 'merge_with_followups',
          },
        ],
      });
    }
  );

  it.each(['critical', 'high'] as const)('blocks a verified %s vulnerability', (severity) => {
    expect(evaluatePolicy(reviewInput({ findings: [vulnerability(severity)] }))).toMatchObject({
      verdictCeiling: 'do_not_merge',
      findings: [
        {
          findingId: `example:vulnerability:${severity}`,
          sourceUrl: source.url,
          severity,
          verdict: 'do_not_merge',
        },
      ],
    });
  });

  it.each(['moderate', 'low', null] as const)(
    'requires follow-up for a %s vulnerability',
    (severity) => {
      expect(evaluatePolicy(reviewInput({ findings: [vulnerability(severity)] }))).toMatchObject({
        verdictCeiling: 'merge_with_followups',
        findings: [{ severity, verdict: 'merge_with_followups' }],
      });
    }
  );

  it('requires follow-up for a range-proven migration', () => {
    expect(
      evaluatePolicy(reviewInput({ findings: [migration('applicable-codemod')] }))
    ).toMatchObject({
      verdictCeiling: 'merge_with_followups',
      findings: [{ kind: 'applicable-codemod', verdict: 'merge_with_followups' }],
    });
  });

  it('blocks a migration proven incompatible with trusted repository context', () => {
    expect(
      evaluatePolicy(reviewInput({ findings: [migration('incompatible-migration')] }))
    ).toMatchObject({
      verdictCeiling: 'do_not_merge',
      findings: [{ kind: 'incompatible-migration', verdict: 'do_not_merge' }],
    });
  });

  it('keeps a blocker above an incomplete-evidence follow-up', () => {
    expect(
      evaluatePolicy(
        reviewInput({ evidenceStatus: 'partial', findings: [vulnerability('critical')] })
      )
    ).toMatchObject({ verdictCeiling: 'do_not_merge' });
  });

  it('leaves license metadata informational', () => {
    expect(evaluatePolicy(reviewInput({ license: 'MIT' }))).toEqual({
      verdictCeiling: 'merge',
      findings: [],
    });
  });
});
