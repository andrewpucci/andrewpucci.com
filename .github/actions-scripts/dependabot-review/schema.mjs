import { decisionUnits } from './decision-units.mjs';

const verdicts = new Set(['merge', 'merge_with_followups', 'do_not_merge', 'analysis_unavailable']);
const policyVerdicts = new Set(['merge', 'merge_with_followups', 'do_not_merge']);
const policyVerdictPriority = new Map([
  ['merge', 0],
  ['merge_with_followups', 1],
  ['do_not_merge', 2],
]);
const usefulness = new Set(['use_now', 'consider_later', 'not_relevant']);
const functionalityKinds = new Set(['new_capability']);
const dependencyManifestPaths = new Set([
  'package.json',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
]);
const futureOnlyUseCase =
  /\b(?:not (?:currently|yet) (?:used|in use|adopted|configured)|future (?:use|adoption)|no (?:existing|current) [^.\n]*\b(?:configuration|config|setup|integration)\b|(?:until|after|when) [^.\n]*\b(?:created|configured|adopted))\b/i;
const hypotheticalUseCase =
  /\b(?:may|might|could) benefit\b|\bfuture [^.\n]*\b(?:logic|work|implementation|usage|need)\b/i;
const requiresConfigurationCreation =
  /\b(?:(?:configuration|config|setup|integration|workflow|file)[^\n]*\bneeds? creation|(?:needs?|requires?) [^.\n]*\b(?:configuration|config|setup|integration|workflow|file)\b[^.\n]*\b(?:creation|creating)\b)\b/i;
const optionalAdoptionFollowup =
  /\b(?:assess|evaluate|consider|determine|review)\b [^.\n]*\b(?:adopt|adopting|enable|enabling)\b/i;
const genericEvidenceFollowup =
  /\b(?:review|validate|confirm|check)\b [^.\n]*\b(?:upstream|release notes?|releases?|package metadata|upgrade (?:evidence|range)|version range)\b|\b(?:confirm|verify|validate)\b [^.\n]*\bno breaking changes\b/i;
const optionalCapabilityUtilityFollowup =
  /\b(?:evaluate|assess|determine)\b [^.\n]*\b(?:utility|usefulness|value)\b [^.\n]*\b(?:new|optional)\b [^.\n]*\b(?:flag|option|feature|capability)\b/i;
const genericNewCapabilityCompatibilityFollowup =
  /\b(?:validate|verify|confirm)\b [^.\n]*\bnew [^.\n]*\b(?:exports?|types?|features?|capabilities?)\b/i;
const concreteRepositorySurface =
  /\b(?:src|tests?|static|docs)\/[\w./-]+|\.github\/[\w./-]+|\b(?:repository|current|existing) [^.\n]*\b(?:local-)?development workflow\b/i;
const unconfirmedCapability =
  /\b(?:(?:immediate )?(?:utility|benefit|usefulness) (?:is )?not (?:confirmed|established)|not (?:yet )?(?:confirmed|established)|new (?:feature|workflow|surface) requiring separate (?:evaluation|adoption)|separate (?:product )?(?:surface|workflow) (?:requires|needs) (?:separate )?(?:evaluation|adoption))\b/i;
const evidenceStatuses = new Set(['available', 'partial', 'unavailable', 'group_backed']);
const evidenceAvailability = new Set([
  'available',
  'not_published',
  'collection_failed',
  'group_backed',
]);
const contextStatuses = new Set(['available', 'partial', 'unavailable']);
const provenanceStatuses = new Set(['verified', 'attention_required', 'unavailable']);
const vulnerabilitySeverities = new Set(['low', 'moderate', 'high', 'critical']);
const contextKinds = new Set(['workflow-action', 'package-usage']);
const sourceKinds = new Set([
  'release-notes',
  'changelog',
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
const coverageStatuses = new Set(['complete', 'pending', 'unresolved']);
const coverageLifecycleStatuses = new Set(['unchanged', 'changed', 'unavailable']);
const coverageMetadataStatuses = new Set(['not_needed', 'pending', 'available', 'unavailable']);
const lifecycleChangeKinds = new Set(['added', 'removed', 'changed']);

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

function parseProvenance(value) {
  const provenance = object(value, 'provenance');
  const allowedFields = new Set(['status', 'invalid', 'missing', 'reason']);
  if (Object.keys(provenance).some((field) => !allowedFields.has(field)))
    throw new TypeError('provenance contains unsupported fields');
  const { status: statusValue, invalid, missing, reason } = provenance;
  const status = string(statusValue, 'provenance status');
  if (!provenanceStatuses.has(status)) throw new TypeError('unsupported provenance status');
  if (
    !Number.isSafeInteger(invalid) ||
    !Number.isSafeInteger(missing) ||
    invalid < 0 ||
    missing < 0 ||
    invalid > 10_000 ||
    missing > 10_000
  )
    throw new TypeError('provenance counts must be bounded non-negative integers');
  if (reason !== null && (typeof reason !== 'string' || !reason || reason.length > 240))
    throw new TypeError('provenance reason must be a bounded string or null');
  if (
    (status === 'verified' && (invalid || missing || reason !== null)) ||
    (status === 'attention_required' && !invalid && !missing) ||
    (status === 'unavailable' && (invalid || missing)) ||
    (status !== 'verified' && typeof reason !== 'string')
  )
    throw new TypeError('provenance status does not match its bounded diagnostics');
  return { status, invalid, missing, reason };
}

const packageIdentity = ({ name, from, to }) => `${name}\u0000${from}\u0000${to}`;
const stricterVerdict = (left, right) =>
  policyVerdictPriority.get(left) >= policyVerdictPriority.get(right) ? left : right;

function packageReference(value, label) {
  const reference = object(value, label);
  return {
    name: string(reference.name, `${label} name`),
    from: string(reference.from, `${label} from version`),
    to: string(reference.to, `${label} to version`),
  };
}

function parseCoverage(value, packages) {
  const coverage = object(value, 'coverage');
  if (Object.keys(coverage).some((field) => field !== 'items'))
    throw new TypeError('coverage contains unsupported fields');
  const packageByIdentity = new Map(
    packages.map((dependency) => [packageIdentity(dependency), dependency])
  );
  const items = array(coverage.items, 'coverage items').map((value) => {
    const item = object(value, 'coverage item');
    const update = packageReference(item.update, 'coverage update');
    const dependency = packageByIdentity.get(packageIdentity(update));
    if (!dependency || item.update.dependencyType !== dependency.dependencyType)
      throw new TypeError('coverage update must match an input package');
    const group = object(item.group, 'coverage group');
    const kind = string(group.kind, 'coverage group kind');
    if (!['direct', 'standalone'].includes(kind)) throw new TypeError('unsupported coverage group');
    const anchor = group.anchor === null ? null : packageReference(group.anchor, 'coverage anchor');
    if ((kind === 'direct' && !anchor) || (kind === 'standalone' && anchor))
      throw new TypeError('coverage group must have a matching anchor');
    if (anchor && !packageByIdentity.has(packageIdentity(anchor)))
      throw new TypeError('coverage anchor must identify an input package');
    const lifecycle = object(item.lifecycle, 'coverage lifecycle');
    const lifecycleStatus = string(lifecycle.status, 'coverage lifecycle status');
    const metadata = string(lifecycle.metadata, 'coverage lifecycle metadata status');
    if (!coverageLifecycleStatuses.has(lifecycleStatus) || !coverageMetadataStatuses.has(metadata))
      throw new TypeError('unsupported coverage lifecycle status');
    const paths = array(lifecycle.paths, 'coverage lifecycle paths');
    if (paths.length > 64) throw new TypeError('coverage lifecycle paths must be bounded');
    const changes = array(lifecycle.changes, 'coverage lifecycle changes').map((change) => {
      const parsed = object(change, 'coverage lifecycle change');
      const name = string(parsed.name, 'coverage lifecycle script name');
      const kind = string(parsed.kind, 'coverage lifecycle change kind');
      if (
        !['preinstall', 'install', 'postinstall'].includes(name) ||
        !lifecycleChangeKinds.has(kind)
      )
        throw new TypeError('unsupported coverage lifecycle change');
      const before =
        parsed.before === undefined ? undefined : string(parsed.before, 'lifecycle before');
      const after =
        parsed.after === undefined ? undefined : string(parsed.after, 'lifecycle after');
      if (
        (kind === 'added' && (before !== undefined || after === undefined)) ||
        (kind === 'removed' && (before === undefined || after !== undefined)) ||
        (kind === 'changed' && (before === undefined || after === undefined))
      )
        throw new TypeError('coverage lifecycle change does not match its kind');
      return {
        name,
        kind,
        ...(before === undefined ? {} : { before }),
        ...(after === undefined ? {} : { after }),
      };
    });
    const status = string(item.status, 'coverage status');
    const reason = item.reason === null ? null : string(item.reason, 'coverage reason');
    if (
      !coverageStatuses.has(status) ||
      (status === 'complete' ? reason !== null : reason === null)
    )
      throw new TypeError('coverage status does not match its reason');
    return {
      update: { ...update, dependencyType: dependency.dependencyType },
      group: { kind, anchor },
      lifecycle: {
        status: lifecycleStatus,
        metadata,
        paths: paths.map((path) => string(path, 'coverage lifecycle path')),
        changes,
        reason:
          lifecycle.reason === null ? null : string(lifecycle.reason, 'coverage lifecycle reason'),
      },
      status,
      reason,
    };
  });
  const identities = new Set(items.map((item) => packageIdentity(item.update)));
  if (
    items.length !== packages.length ||
    identities.size !== packages.length ||
    [...packageByIdentity].some(([key]) => !identities.has(key))
  )
    throw new TypeError('coverage must account for every input package exactly once');
  return { items };
}

function validateGroupBackedEvidence(packages, coverage) {
  const coverageByPackage = new Map(
    (coverage?.items ?? []).map((item) => [packageIdentity(item.update), item])
  );
  for (const dependency of packages) {
    if (dependency.evidence.status !== 'group_backed') continue;
    const item = coverageByPackage.get(packageIdentity(dependency));
    if (
      !item ||
      item.group.kind !== 'direct' ||
      packageIdentity(item.group.anchor) === packageIdentity(dependency)
    )
      throw new TypeError(
        'group-backed evidence must belong to a non-anchor direct coverage group'
      );
  }
}

export function parseReviewInput(value) {
  const input = object(value, 'review input');
  const pullRequest = object(input.pullRequest, 'pull request');
  if (!Number.isSafeInteger(pullRequest.number) || pullRequest.number < 1)
    throw new TypeError('pull request number must be a positive integer');
  const provenance = input.provenance === undefined ? undefined : parseProvenance(input.provenance);
  const packages = array(input.packages, 'packages').map((value) => {
    const dependency = object(value, 'package');
    const evidence = object(dependency.evidence, 'package evidence');
    const status = string(evidence.status, 'evidence status');
    if (!evidenceStatuses.has(status)) throw new TypeError('unsupported evidence status');
    const availability =
      evidence.availability === undefined
        ? undefined
        : string(evidence.availability, 'evidence availability');
    if (
      (availability !== undefined && !evidenceAvailability.has(availability)) ||
      (availability === 'group_backed' && status !== 'group_backed') ||
      (availability !== undefined &&
        availability !== 'group_backed' &&
        status === 'group_backed') ||
      (['not_published', 'collection_failed'].includes(availability) && status !== 'unavailable')
    )
      throw new TypeError('evidence availability does not match its status');
    const context = object(dependency.context, 'package context');
    const contextStatus = string(context.status, 'context status');
    if (!contextStatuses.has(contextStatus)) throw new TypeError('unsupported context status');
    const facts = array(context.facts, 'context facts').map((value) => {
      const fact = object(value, 'context fact');
      const kind = string(fact.kind, 'context fact kind');
      const path = string(fact.path, 'context fact path');
      if (!contextKinds.has(kind) || path.startsWith('/') || path.includes('..'))
        throw new TypeError('context fact must have a trusted repository path');
      return {
        kind,
        path,
        excerpt: string(fact.excerpt, 'context fact excerpt'),
      };
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
        ...(availability === undefined ? {} : { availability }),
      },
      context: { status: contextStatus, facts },
      sources,
      findings,
    };
  });
  const coverage =
    input.coverage === undefined ? undefined : parseCoverage(input.coverage, packages);
  validateGroupBackedEvidence(packages, coverage);
  return {
    pullRequest: {
      number: pullRequest.number,
      baseSha: string(pullRequest.baseSha, 'base SHA'),
      headSha: string(pullRequest.headSha, 'head SHA'),
    },
    packages,
    ...(coverage === undefined ? {} : { coverage }),
    ...(provenance === undefined ? {} : { provenance }),
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
      const hasUpgradeEvidence = dependency.sources.some((source) =>
        ['release-notes', 'repository-compare', 'changelog'].includes(source.kind)
      );
      const hasInsufficientEvidence =
        dependency.evidence.availability !== 'not_published' &&
        (dependency.evidence.status === 'unavailable' ||
          (dependency.evidence.status === 'partial' && !hasUpgradeEvidence));
      if (kind !== 'evidence-incomplete' || sourceUrl !== null || !hasInsufficientEvidence)
        throw new TypeError('evidence policy finding must match insufficient input evidence');
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

function parsePackageAnalysis(value, input) {
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
  const parseCapability = (value, dependency, assessmentSourceUrls) => {
    try {
      const feature = object(value, 'feature');
      const kind = string(feature.kind, 'feature kind');
      if (!functionalityKinds.has(kind)) return null;
      const usefulnessValue = string(feature.usefulness, 'feature usefulness');
      if (!usefulness.has(usefulnessValue)) return null;
      const sourceUrl = string(feature.sourceUrl, 'feature source URL');
      if (!sourceUrls.has(sourceUrl) || !assessmentSourceUrls.has(sourceUrl)) return null;
      const action =
        feature.action === undefined || feature.action === null
          ? null
          : string(feature.action, 'feature action');
      const contextPath =
        feature.contextPath === undefined || feature.contextPath === null
          ? null
          : string(feature.contextPath, 'feature context path');
      const featureName = string(feature.feature, 'feature');
      const rationale = string(feature.rationale, 'feature rationale');
      if (
        usefulnessValue !== 'not_relevant' &&
        (!action ||
          !contextPath ||
          dependencyManifestPaths.has(contextPath) ||
          !dependency.context.facts.some((fact) => fact.path === contextPath) ||
          futureOnlyUseCase.test(`${featureName}\n${action}\n${rationale}`) ||
          hypotheticalUseCase.test(`${featureName}\n${action}\n${rationale}`) ||
          requiresConfigurationCreation.test(`${featureName}\n${action}\n${rationale}`) ||
          unconfirmedCapability.test(`${featureName}\n${action}\n${rationale}`))
      )
        return null;
      return {
        kind,
        feature: featureName,
        sourceUrl,
        usefulness: usefulnessValue,
        action,
        contextPath,
        rationale,
      };
    } catch {
      return null;
    }
  };
  const assessments = array(analysis.packageAssessments, 'package assessments').map((value) => {
    const item = object(value, 'package assessment');
    const name = string(item.name, 'assessment package name');
    const from = string(item.from, 'assessment from version');
    const to = string(item.to, 'assessment to version');
    const dependency = packages.get(packageIdentity({ name, from, to }));
    if (!dependency) throw new TypeError('analysis references an unknown package');
    const assessmentSourceUrls = new Set(dependency.sources.map((source) => source.url));
    const candidates = Array.isArray(item.newFunctionality) ? item.newFunctionality : [];
    const capability =
      candidates.length === 1 && dependency.evidence?.status !== 'group_backed'
        ? parseCapability(candidates[0], dependency, assessmentSourceUrls)
        : null;
    return {
      name,
      from,
      to,
      newFunctionality: capability ? [capability] : [],
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
  const followups = array(analysis.followups, 'followups').map((value) => {
    const followup = object(value, 'followup');
    if (Object.keys(followup).some((field) => !['description', 'blocking'].includes(field)))
      throw new TypeError('followup contains unsupported fields');
    const description = string(followup.description, 'followup description');
    if (description.length > 280 || followup.blocking !== false)
      throw new TypeError('followup must be bounded and explicitly non-blocking');
    return { description, blocking: false };
  });
  if (
    followups.length > 8 ||
    (verdict === 'merge_with_followups' && !followups.length) ||
    (verdict !== 'merge_with_followups' && followups.length)
  )
    throw new TypeError('followups do not match the advisory verdict');
  return {
    verdict,
    summary: string(analysis.summary, 'summary'),
    packageAssessments: assessments,
    blockers,
    followups,
    remediationPrompt:
      analysis.remediationPrompt === null
        ? null
        : string(analysis.remediationPrompt, 'remediation prompt'),
  };
}

function isDecisionAssessment(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function aggregateDecisionVerdict(assessments) {
  return assessments.reduce(
    (current, assessment) => stricterVerdict(current, assessment.verdict),
    'merge'
  );
}

function parseDecisionFollowups(verdict, value) {
  const candidates = array(value, 'decision followups');
  if (
    candidates.length > 8 ||
    (verdict === 'merge_with_followups' && !candidates.length) ||
    (verdict !== 'merge_with_followups' && candidates.length)
  )
    throw new TypeError('decision followups do not match the advisory verdict');
  return candidates.flatMap((value) => {
    const followup = object(value, 'decision followup');
    if (Object.keys(followup).some((field) => !['description', 'blocking'].includes(field)))
      throw new TypeError('decision followup contains unsupported fields');
    const description = string(followup.description, 'decision followup description');
    if (description.length > 280 || followup.blocking !== false)
      throw new TypeError('decision followup must be bounded and explicitly non-blocking');
    return requiresConfigurationCreation.test(description) ||
      optionalAdoptionFollowup.test(description) ||
      genericEvidenceFollowup.test(description) ||
      optionalCapabilityUtilityFollowup.test(description) ||
      (genericNewCapabilityCompatibilityFollowup.test(description) &&
        !concreteRepositorySurface.test(description))
      ? []
      : [{ description, blocking: false }];
  });
}

function researchUnit(unit) {
  return {
    group: unit.group,
    members: unit.members.map(({ name, from, to }) => ({ name, from, to })),
    count: unit.members.length,
  };
}

function normalizeDecisionAnalysis(value, input) {
  const analysis = object(value, 'analysis');
  if (Object.keys(analysis).some((field) => field !== 'decisionAssessments'))
    throw new TypeError('decision analysis contains unsupported fields');
  const units = decisionUnits(input);
  const expected = new Map(units.map((unit) => [unit.id, unit]));
  const assessments = array(analysis.decisionAssessments, 'decision assessments').map((value) => {
    if (!isDecisionAssessment(value)) throw new TypeError('decision assessment must be an object');
    const fields = [
      'decisionUnit',
      'verdict',
      'summary',
      'newFunctionality',
      'blockers',
      'followups',
      'remediationPrompt',
    ];
    if (Object.keys(value).some((field) => !fields.includes(field)))
      throw new TypeError('decision assessment contains unsupported fields');
    const decisionUnit = string(value.decisionUnit, 'decision unit');
    const unit = expected.get(decisionUnit);
    if (!unit) throw new TypeError('analysis references an unknown decision unit');
    const requestedVerdict = string(value.verdict, 'decision verdict');
    if (!policyVerdicts.has(requestedVerdict)) throw new TypeError('unsupported decision verdict');
    const followups = parseDecisionFollowups(requestedVerdict, value.followups);
    const verdict =
      requestedVerdict === 'merge_with_followups' && !followups.length ? 'merge' : requestedVerdict;
    const assessment = {
      decisionUnit,
      unit,
      verdict,
      summary: string(value.summary, 'decision summary'),
      newFunctionality: array(value.newFunctionality, 'decision new functionality'),
      blockers: array(value.blockers, 'decision blockers'),
      followups,
      remediationPrompt: value.remediationPrompt,
    };
    return assessment;
  });
  if (
    assessments.length !== units.length ||
    new Set(assessments.map(({ decisionUnit }) => decisionUnit)).size !== units.length
  )
    throw new TypeError('analysis must contain exactly one decision assessment per input unit');
  const verdict = aggregateDecisionVerdict(assessments);
  const followups =
    verdict === 'merge_with_followups'
      ? assessments.flatMap((assessment) => assessment.followups)
      : [];
  const followupUnits =
    verdict === 'merge_with_followups'
      ? assessments.flatMap((assessment) =>
          assessment.followups.map(() => researchUnit(assessment.unit))
        )
      : [];
  const packageAssessments = assessments.flatMap((assessment) =>
    assessment.unit.members.map((dependency) => ({
      name: dependency.name,
      from: dependency.from,
      to: dependency.to,
      newFunctionality:
        packageIdentity(dependency) === packageIdentity(assessment.unit.anchor)
          ? assessment.newFunctionality
          : [],
    }))
  );
  return {
    analysis: {
      verdict,
      summary: assessments.map((assessment) => assessment.summary).join(' '),
      packageAssessments,
      blockers: assessments.flatMap((assessment) => assessment.blockers),
      followups,
      remediationPrompt:
        assessments.find((assessment) => assessment.remediationPrompt !== null)
          ?.remediationPrompt ?? null,
    },
    followupUnits,
  };
}

export function parseAnalysis(value, input) {
  if (!value || typeof value !== 'object' || !('decisionAssessments' in value))
    return parsePackageAnalysis(value, input);
  const normalized = normalizeDecisionAnalysis(value, input);
  const analysis = parsePackageAnalysis(normalized.analysis, input);
  return {
    ...analysis,
    followups: analysis.followups.map((followup, index) => ({
      ...followup,
      researchUnit: normalized.followupUnits.at(index),
    })),
  };
}
