const verdicts = new Set(['merge', 'merge_with_followups', 'do_not_merge', 'analysis_unavailable']);
const usefulness = new Set(['use_now', 'consider_later', 'not_relevant']);
const sourceKinds = new Set([
  'release-notes',
  'migration-guide',
  'codemod-guide',
  'github-advisory',
]);
const blockerKinds = new Set([
  'vulnerability',
  'license-policy',
  'incompatible-migration',
  'applicable-codemod',
]);

function object(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new TypeError(`${label} must be an object`);
  return value;
}
function string(value, label) {
  if (typeof value !== 'string' || !value)
    throw new TypeError(`${label} must be a non-empty string`);
  return value;
}
function array(value, label) {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`);
  return value;
}

export function parseReviewInput(value) {
  const input = object(value, 'review input');
  const pullRequest = object(input.pullRequest, 'pull request');
  if (!Number.isSafeInteger(pullRequest.number) || pullRequest.number < 1)
    throw new TypeError('pull request number must be a positive integer');
  return {
    pullRequest: {
      number: pullRequest.number,
      baseSha: string(pullRequest.baseSha, 'base SHA'),
      headSha: string(pullRequest.headSha, 'head SHA'),
    },
    packages: array(input.packages, 'packages').map((value) => {
      const dependency = object(value, 'package');
      const sources = array(dependency.sources, 'sources').map((value) => {
        const source = object(value, 'source');
        const kind = string(source.kind, 'source kind');
        const url = string(source.url, 'source URL');
        if (!sourceKinds.has(kind) || new URL(url).protocol !== 'https:')
          throw new TypeError('source must be an HTTPS official evidence source');
        return {
          kind,
          url,
          title: string(source.title, 'source title'),
          excerpt: string(source.excerpt, 'source excerpt'),
        };
      });
      const sourceUrls = new Set(sources.map((source) => source.url));
      const findings = array(dependency.findings, 'findings').map((value) => {
        const finding = object(value, 'finding');
        const id = string(finding.id, 'finding ID');
        const kind = string(finding.kind, 'finding kind');
        const sourceUrl = string(finding.sourceUrl, 'finding source URL');
        if (!blockerKinds.has(kind) || !sourceUrls.has(sourceUrl))
          throw new TypeError('finding must use a known blocker kind and evidence URL');
        return {
          id,
          kind,
          reason: string(finding.reason, 'finding reason'),
          sourceUrl,
          remediation: array(finding.remediation, 'finding remediation').map((item) =>
            string(item, 'remediation item')
          ),
          validation: array(finding.validation, 'finding validation').map((item) =>
            string(item, 'validation item')
          ),
          ...(typeof finding.codemodCommand === 'string'
            ? { codemodCommand: finding.codemodCommand }
            : {}),
        };
      });
      return {
        name: string(dependency.name, 'package name'),
        from: string(dependency.from, 'package from version'),
        to: string(dependency.to, 'package to version'),
        dependencyType: string(dependency.dependencyType, 'dependency type'),
        license: dependency.license === null ? null : string(dependency.license, 'package license'),
        sources,
        findings,
      };
    }),
  };
}

export function parseAnalysis(value, input) {
  const analysis = object(value, 'analysis');
  const verdict = string(analysis.verdict, 'verdict');
  if (!verdicts.has(verdict)) throw new TypeError('unsupported verdict');
  const sourceUrls = new Set(
    input.packages.flatMap((dependency) => dependency.sources.map((source) => source.url))
  );
  const findings = new Map(
    input.packages.flatMap((dependency) =>
      dependency.findings.map((finding) => [finding.id, finding])
    )
  );
  const requireUrl = (url) => {
    if (!sourceUrls.has(url)) throw new TypeError(`unknown evidence URL: ${url}`);
    return url;
  };
  const assessments = array(analysis.packageAssessments, 'package assessments').map((value) => {
    const item = object(value, 'package assessment');
    return {
      name: string(item.name, 'assessment package name'),
      from: string(item.from, 'assessment from version'),
      to: string(item.to, 'assessment to version'),
      newFunctionality: array(item.newFunctionality, 'new functionality').map((value) => {
        const feature = object(value, 'feature');
        const usefulnessValue = string(feature.usefulness, 'feature usefulness');
        if (!usefulness.has(usefulnessValue)) throw new TypeError('unsupported usefulness');
        return {
          feature: string(feature.feature, 'feature'),
          sourceUrl: requireUrl(string(feature.sourceUrl, 'feature source URL')),
          usefulness: usefulnessValue,
          rationale: string(feature.rationale, 'feature rationale'),
        };
      }),
    };
  });
  const blockers = array(analysis.blockers, 'blockers').map((value) => {
    const item = object(value, 'blocker');
    const findingId = string(item.findingId, 'blocker finding ID');
    const finding = findings.get(findingId);
    if (!finding) throw new TypeError('blocker must identify a verified input finding');
    const evidence = array(item.evidence, 'blocker evidence').map((value) => {
      const evidence = object(value, 'blocker evidence item');
      return {
        claim: string(evidence.claim, 'blocker claim'),
        sourceUrl: requireUrl(string(evidence.sourceUrl, 'blocker evidence URL')),
      };
    });
    if (!evidence.length || !evidence.some((item) => item.sourceUrl === finding.sourceUrl))
      throw new TypeError('blocker must cite its verified input finding');
    return {
      findingId,
      reason: string(item.reason, 'blocker reason'),
      impact: string(item.impact, 'blocker impact'),
      evidence,
      remediation: array(item.remediation, 'blocker remediation').map((item) =>
        string(item, 'blocker remediation item')
      ),
      validation: array(item.validation, 'blocker validation').map((item) =>
        string(item, 'blocker validation item')
      ),
    };
  });
  if (verdict === 'do_not_merge' && !blockers.length)
    throw new TypeError('do_not_merge requires a verified input finding');
  return {
    verdict,
    summary: string(analysis.summary, 'summary'),
    packageAssessments: assessments,
    blockers,
    remediationPrompt:
      analysis.remediationPrompt === null
        ? null
        : string(analysis.remediationPrompt, 'remediation prompt'),
  };
}
