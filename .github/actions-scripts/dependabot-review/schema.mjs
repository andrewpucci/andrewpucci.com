const verdicts = new Set(['merge', 'merge_with_followups', 'do_not_merge', 'analysis_unavailable']);
const policyVerdicts = new Set(['merge', 'merge_with_followups', 'do_not_merge']);
const policyVerdictPriority = new Map([
  ['merge', 0],
  ['merge_with_followups', 1],
  ['do_not_merge', 2],
]);
const usefulness = new Set(['use_now', 'consider_later', 'not_relevant']);
const evidenceStatuses = new Set(['available', 'partial', 'unavailable']);
const vulnerabilitySeverities = new Set(['low', 'moderate', 'high', 'critical']);
const contextKinds = new Set(['workflow-action', 'package-usage']);
const sourceKinds = new Set([
  'release-notes',
  'repository-compare',
  'package-metadata',
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

export const isVulnerabilitySeverity = (value) =>
  typeof value === 'string' && vulnerabilitySeverities.has(value);

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
const packageIdentity = ({ name, from, to }) => `${name}\u0000${from}\u0000${to}`;
const stricterVerdict = (left, right) =>
  policyVerdictPriority.get(left) >= policyVerdictPriority.get(right) ? left : right;

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
      const evidence = object(dependency.evidence, 'package evidence');
      const status = string(evidence.status, 'evidence status');
      if (!evidenceStatuses.has(status)) throw new TypeError('unsupported evidence status');
      const context = object(dependency.context, 'package context');
      const contextStatus = string(context.status, 'context status');
      if (!evidenceStatuses.has(contextStatus)) throw new TypeError('unsupported context status');
      const facts = array(context.facts, 'context facts').map((value) => {
        const fact = object(value, 'context fact');
        const kind = string(fact.kind, 'context fact kind');
        const path = string(fact.path, 'context fact path');
        if (!contextKinds.has(kind) || path.startsWith('/') || path.includes('..'))
          throw new TypeError('context fact must have a trusted repository path');
        return { kind, path, excerpt: string(fact.excerpt, 'context fact excerpt') };
      });
      const sources = array(dependency.sources, 'sources').map((value) => {
        const source = object(value, 'source');
        const kind = string(source.kind, 'source kind');
        const url = string(source.url, 'source URL');
        if (!sourceKinds.has(kind) || new URL(url).protocol !== 'https:')
          throw new TypeError('source must be an HTTPS official evidence source');
        const range = object(source.range, 'source range');
        return {
          kind,
          url,
          title: string(source.title, 'source title'),
          excerpt: string(source.excerpt, 'source excerpt'),
          range: {
            from: string(range.from, 'source range from version'),
            to: string(range.to, 'source range to version'),
          },
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
        const severity = finding.severity ?? null;
        if (severity !== null && (kind !== 'vulnerability' || !isVulnerabilitySeverity(severity)))
          throw new TypeError('vulnerability severity must be low, moderate, high, or critical');
        return {
          id,
          kind,
          reason: string(finding.reason, 'finding reason'),
          sourceUrl,
          ...(kind === 'vulnerability' ? { severity } : {}),
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
        evidence: {
          status,
          reason: evidence.reason === null ? null : string(evidence.reason, 'evidence reason'),
        },
        context: { status: contextStatus, facts },
        sources,
        findings,
      };
    }),
  };
}

export function parsePolicy(value, input) {
  const policy = object(value, 'policy');
  const verdictCeiling = string(policy.verdictCeiling, 'policy verdict ceiling');
  if (!policyVerdicts.has(verdictCeiling))
    throw new TypeError('unsupported policy verdict ceiling');
  const packages = new Map(
    input.packages.map((dependency) => [packageIdentity(dependency), dependency])
  );
  const findings = array(policy.findings, 'policy findings').map((value) => {
    const finding = object(value, 'policy finding');
    const packageValue = object(finding.package, 'policy finding package');
    const packageKey = packageIdentity({
      name: string(packageValue.name, 'policy package name'),
      from: string(packageValue.from, 'policy package from version'),
      to: string(packageValue.to, 'policy package to version'),
    });
    const dependency = packages.get(packageKey);
    if (!dependency) throw new TypeError('policy finding must identify an input package');
    const findingId =
      finding.findingId === null ? null : string(finding.findingId, 'policy finding ID');
    const kind = string(finding.kind, 'policy finding kind');
    const sourceUrl =
      finding.sourceUrl === null ? null : string(finding.sourceUrl, 'policy source URL');
    const severity = finding.severity ?? null;
    if (findingId === null) {
      if (
        kind !== 'evidence-incomplete' ||
        sourceUrl !== null ||
        dependency.evidence.status === 'available'
      )
        throw new TypeError('evidence policy finding must match incomplete input evidence');
      if (severity !== null)
        throw new TypeError('evidence policy finding cannot include a severity');
    } else {
      const inputFinding = dependency.findings.find((candidate) => candidate.id === findingId);
      if (!inputFinding || inputFinding.kind !== kind || inputFinding.sourceUrl !== sourceUrl)
        throw new TypeError('policy finding must use a known input finding and source URL');
      if ((inputFinding.severity ?? null) !== severity)
        throw new TypeError('policy finding severity must match its input finding');
    }
    const verdict = string(finding.verdict, 'policy finding verdict');
    if (!policyVerdicts.has(verdict)) throw new TypeError('unsupported policy finding verdict');
    return {
      package: {
        name: dependency.name,
        from: dependency.from,
        to: dependency.to,
      },
      findingId,
      kind,
      sourceUrl,
      severity,
      verdict,
      reason: string(finding.reason, 'policy finding reason'),
      remediation: array(finding.remediation, 'policy finding remediation').map((item) =>
        string(item, 'policy finding remediation item')
      ),
      validation: array(finding.validation, 'policy finding validation').map((item) =>
        string(item, 'policy finding validation item')
      ),
    };
  });
  const expectedCeiling = findings.reduce(
    (current, finding) => stricterVerdict(current, finding.verdict),
    'merge'
  );
  if (verdictCeiling !== expectedCeiling)
    throw new TypeError('policy verdict ceiling must match its findings');
  return { verdictCeiling, findings };
}

export function parseAnalysis(value, input) {
  const analysis = object(value, 'analysis');
  const verdict = string(analysis.verdict, 'verdict');
  if (!verdicts.has(verdict)) throw new TypeError('unsupported verdict');
  const policy = input.policy === undefined ? null : parsePolicy(input.policy, input);
  if (
    policy &&
    verdict !== 'analysis_unavailable' &&
    stricterVerdict(verdict, policy.verdictCeiling) !== verdict
  )
    throw new TypeError('analysis verdict exceeds the policy ceiling');
  const sourceUrls = new Set(
    input.packages.flatMap((dependency) => dependency.sources.map((source) => source.url))
  );
  const packages = new Map(
    input.packages.map((dependency) => [packageIdentity(dependency), dependency])
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
    const name = string(item.name, 'assessment package name');
    const from = string(item.from, 'assessment from version');
    const to = string(item.to, 'assessment to version');
    const dependency = packages.get(packageIdentity({ name, from, to }));
    if (!dependency) throw new TypeError('analysis references an unknown package');
    const assessmentSourceUrls = new Set(dependency.sources.map((source) => source.url));
    const newFunctionality = array(item.newFunctionality, 'new functionality');
    if (newFunctionality.length > 1)
      throw new TypeError('analysis may contain at most one feature per package assessment');
    return {
      name,
      from,
      to,
      newFunctionality: newFunctionality.map((value) => {
        const feature = object(value, 'feature');
        const usefulnessValue = string(feature.usefulness, 'feature usefulness');
        if (!usefulness.has(usefulnessValue)) throw new TypeError('unsupported usefulness');
        const sourceUrl = requireUrl(string(feature.sourceUrl, 'feature source URL'));
        if (!assessmentSourceUrls.has(sourceUrl))
          throw new TypeError('feature must cite evidence for its assessed package');
        const action =
          feature.action === undefined || feature.action === null
            ? null
            : string(feature.action, 'feature action');
        const contextPath =
          feature.contextPath === undefined || feature.contextPath === null
            ? null
            : string(feature.contextPath, 'feature context path');
        if (
          usefulnessValue === 'use_now' &&
          (!action ||
            !contextPath ||
            !dependency.context.facts.some((fact) => fact.path === contextPath))
        )
          throw new TypeError('use_now requires an action and matching trusted repository context');
        return {
          feature: string(feature.feature, 'feature'),
          sourceUrl,
          usefulness: usefulnessValue,
          action,
          contextPath,
          rationale: string(feature.rationale, 'feature rationale'),
        };
      }),
    };
  });
  const expectedAssessments = new Set(
    input.packages.map(({ name, from, to }) => `${name}\u0000${from}\u0000${to}`)
  );
  const actualAssessments = new Set(
    assessments.map(({ name, from, to }) => `${name}\u0000${from}\u0000${to}`)
  );
  if (
    assessments.length !== input.packages.length ||
    actualAssessments.size !== expectedAssessments.size ||
    [...actualAssessments].some((assessment) => !expectedAssessments.has(assessment))
  )
    throw new TypeError('analysis must contain exactly one package assessment per input package');
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
