export type EvidenceSourceKind = 'release-notes' | 'migration-guide' | 'codemod-guide';
export type Usefulness = 'use_now' | 'consider_later' | 'not_relevant';
export type Verdict = 'merge' | 'merge_with_followups' | 'do_not_merge' | 'analysis_unavailable';

export type EvidenceSource = {
  kind: EvidenceSourceKind;
  url: string;
  title: string;
  excerpt: string;
};

export type ReviewFinding = {
  kind: 'vulnerability' | 'license-policy' | 'incompatible-migration' | 'applicable-codemod';
  reason: string;
  sourceUrl: string;
  remediation: string[];
  validation: string[];
  codemodCommand?: string;
};

export type ReviewInput = {
  pullRequest: { number: number; baseSha: string; headSha: string };
  packages: Array<{
    name: string;
    from: string;
    to: string;
    dependencyType: string;
    sources: EvidenceSource[];
    findings: ReviewFinding[];
  }>;
};

export type ReviewAnalysis = {
  verdict: Verdict;
  summary: string;
  packageAssessments: Array<{
    name: string;
    from: string;
    to: string;
    newFunctionality: Array<{
      feature: string;
      sourceUrl: string;
      usefulness: Usefulness;
      rationale: string;
    }>;
  }>;
  blockers: Array<{
    reason: string;
    impact: string;
    evidence: Array<{ claim: string; sourceUrl: string }>;
    remediation: string[];
    validation: string[];
  }>;
  remediationPrompt: string | null;
};

const evidenceKinds = new Set<EvidenceSourceKind>([
  'release-notes',
  'migration-guide',
  'codemod-guide',
]);
const usefulnessValues = new Set<Usefulness>(['use_now', 'consider_later', 'not_relevant']);
const verdictValues = new Set<Verdict>([
  'merge',
  'merge_with_followups',
  'do_not_merge',
  'analysis_unavailable',
]);
const blockingFindingKinds = new Set<ReviewFinding['kind']>([
  'vulnerability',
  'license-policy',
  'incompatible-migration',
  'applicable-codemod',
]);

function record(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new TypeError(`${label} must be a non-empty string`);
  }
  return value;
}

function list(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new TypeError(`${label} must be an array`);
  }
  return value;
}

function knownUrl(value: string, sources: ReadonlySet<string>): void {
  if (!sources.has(value)) {
    throw new TypeError(`unknown evidence URL: ${value}`);
  }
}

export function parseReviewInput(value: unknown): ReviewInput {
  const input = record(value, 'review input');
  const pullRequest = record(input.pullRequest, 'pull request');
  if (!Number.isSafeInteger(pullRequest.number) || (pullRequest.number as number) < 1) {
    throw new TypeError('pull request number must be a positive integer');
  }

  const packages = list(input.packages, 'packages').map((packageValue) => {
    const dependency = record(packageValue, 'package');
    const sources = list(dependency.sources, 'sources').map((sourceValue) => {
      const source = record(sourceValue, 'source');
      const kind = text(source.kind, 'source kind') as EvidenceSourceKind;
      const url = text(source.url, 'source URL');
      const parsedUrl = new URL(url);
      if (!evidenceKinds.has(kind) || parsedUrl.protocol !== 'https:') {
        throw new TypeError('source must be an HTTPS official evidence source');
      }
      return {
        kind,
        url,
        title: text(source.title, 'source title'),
        excerpt: text(source.excerpt, 'source excerpt'),
      };
    });

    const findings = list(dependency.findings, 'findings').map((findingValue) => {
      const finding = record(findingValue, 'finding');
      return {
        kind: text(finding.kind, 'finding kind') as ReviewFinding['kind'],
        reason: text(finding.reason, 'finding reason'),
        sourceUrl: text(finding.sourceUrl, 'finding source URL'),
        remediation: list(finding.remediation, 'finding remediation').map((item) =>
          text(item, 'remediation item')
        ),
        validation: list(finding.validation, 'finding validation').map((item) =>
          text(item, 'validation item')
        ),
        ...(typeof finding.codemodCommand === 'string'
          ? { codemodCommand: finding.codemodCommand }
          : {}),
      };
    });

    return {
      name: text(dependency.name, 'package name'),
      from: text(dependency.from, 'package from version'),
      to: text(dependency.to, 'package to version'),
      dependencyType: text(dependency.dependencyType, 'dependency type'),
      sources,
      findings,
    };
  });

  return {
    pullRequest: {
      number: pullRequest.number as number,
      baseSha: text(pullRequest.baseSha, 'base SHA'),
      headSha: text(pullRequest.headSha, 'head SHA'),
    },
    packages,
  };
}

export function parseAnalysis(value: unknown, input: ReviewInput): ReviewAnalysis {
  const analysis = record(value, 'analysis');
  const verdict = text(analysis.verdict, 'verdict') as Verdict;
  if (!verdictValues.has(verdict)) throw new TypeError('unsupported verdict');

  const sourceUrls = new Set(
    input.packages.flatMap((dependency) => dependency.sources.map((source) => source.url))
  );
  const packageAssessments = list(analysis.packageAssessments, 'package assessments').map(
    (assessmentValue) => {
      const assessment = record(assessmentValue, 'package assessment');
      return {
        name: text(assessment.name, 'assessment package name'),
        from: text(assessment.from, 'assessment from version'),
        to: text(assessment.to, 'assessment to version'),
        newFunctionality: list(assessment.newFunctionality, 'new functionality').map(
          (featureValue) => {
            const feature = record(featureValue, 'feature');
            const usefulness = text(feature.usefulness, 'feature usefulness') as Usefulness;
            if (!usefulnessValues.has(usefulness)) throw new TypeError('unsupported usefulness');
            const sourceUrl = text(feature.sourceUrl, 'feature source URL');
            knownUrl(sourceUrl, sourceUrls);
            return {
              feature: text(feature.feature, 'feature'),
              sourceUrl,
              usefulness,
              rationale: text(feature.rationale, 'feature rationale'),
            };
          }
        ),
      };
    }
  );

  const blockers = list(analysis.blockers, 'blockers').map((blockerValue) => {
    const blocker = record(blockerValue, 'blocker');
    return {
      reason: text(blocker.reason, 'blocker reason'),
      impact: text(blocker.impact, 'blocker impact'),
      evidence: list(blocker.evidence, 'blocker evidence').map((evidenceValue) => {
        const evidence = record(evidenceValue, 'blocker evidence item');
        const sourceUrl = text(evidence.sourceUrl, 'blocker evidence URL');
        knownUrl(sourceUrl, sourceUrls);
        return { claim: text(evidence.claim, 'blocker claim'), sourceUrl };
      }),
      remediation: list(blocker.remediation, 'blocker remediation').map((item) =>
        text(item, 'blocker remediation item')
      ),
      validation: list(blocker.validation, 'blocker validation').map((item) =>
        text(item, 'blocker validation item')
      ),
    };
  });

  if (verdict === 'do_not_merge' && blockers.length === 0) {
    throw new TypeError('do_not_merge requires at least one blocker');
  }
  if (
    verdict === 'do_not_merge' &&
    !input.packages.some((dependency) =>
      dependency.findings.some((finding) => blockingFindingKinds.has(finding.kind))
    )
  ) {
    throw new TypeError('do_not_merge requires a verified input finding');
  }

  return {
    verdict,
    summary: text(analysis.summary, 'summary'),
    packageAssessments,
    blockers,
    remediationPrompt:
      analysis.remediationPrompt === null
        ? null
        : text(analysis.remediationPrompt, 'remediation prompt'),
  };
}
