const defaults = {
  deadlineMs: 240_000,
  maxBatchChars: 18_000,
  maxPackageChars: 5_600,
  maxPackagesPerBatch: 3,
  maxConcurrency: 2,
  maxRequests: 12,
  requestTimeoutMs: 120_000,
  maxContextExcerptChars: 1_200,
  maxSourceExcerptChars: 1_200,
};
const verdictPriority = new Map([
  ['merge', 0],
  ['merge_with_followups', 1],
  ['decision_incomplete', 2],
  ['do_not_merge', 3],
]);

const identity = ({ name, from, to }) => `${name}\u0000${from}\u0000${to}`;

function projectedPackage(dependency, limits) {
  const sources = dependency.sources.map((source) => ({
    ...source,
    excerpt: '',
    excerptTruncated: false,
  }));
  const facts = dependency.context.facts.map((fact) => ({
    ...fact,
    excerpt: '',
    excerptTruncated: false,
  }));
  const overhead = JSON.stringify({
    ...dependency,
    sources,
    context: { ...dependency.context, facts },
  }).length;
  const available = Math.max(0, limits.maxPackageChars - overhead);
  const perSource = Math.min(
    limits.maxSourceExcerptChars,
    sources.length + facts.length ? Math.floor(available / (sources.length + facts.length)) : 0
  );
  return {
    ...dependency,
    sources: dependency.sources.map((source) => ({
      ...source,
      excerpt: source.excerpt.slice(0, perSource),
      excerptTruncated: source.excerptTruncated || source.excerpt.length > perSource,
    })),
    context: {
      ...dependency.context,
      facts: dependency.context.facts.map((fact) => {
        const maxExcerpt = Math.min(perSource, limits.maxContextExcerptChars);
        return {
          ...fact,
          excerpt: fact.excerpt.slice(0, maxExcerpt),
          excerptTruncated: fact.excerptTruncated || fact.excerpt.length > maxExcerpt,
        };
      }),
    },
  };
}

export function projectForModel(input, options = {}) {
  const limits = { ...defaults, ...options };
  const packageIds = new Set(input.packages.map(identity));
  const coverageItems = input.coverage?.items.filter((item) =>
    packageIds.has(identity(item.update))
  );
  const modelInput = {
    ...input,
    ...(coverageItems ? { coverage: { items: coverageItems } } : {}),
  };
  delete modelInput.provenance;
  const policyFindings = input.policy?.findings.filter((finding) =>
    packageIds.has(identity(finding.package))
  );
  const policy = policyFindings
    ? {
        ...input.policy,
        verdictCeiling: policyFindings.reduce(
          (current, finding) => stricter(current, finding.verdict),
          'merge'
        ),
        findings: policyFindings,
      }
    : undefined;
  return {
    ...modelInput,
    ...(policy ? { policy } : {}),
    packages: input.packages.map((dependency) => projectedPackage(dependency, limits)),
  };
}

function coverageGroupKey(input, dependency) {
  const item = input.coverage?.items.find(
    (candidate) => identity(candidate.update) === identity(dependency)
  );
  return item?.group.kind === 'direct'
    ? `direct:${identity(item.group.anchor)}`
    : `standalone:${identity(dependency)}`;
}

function decisionUnits(input) {
  const units = new Map();
  for (const dependency of input.packages) {
    const key = coverageGroupKey(input, dependency);
    const unit = units.get(key) ?? [];
    unit.push(dependency);
    units.set(key, unit);
  }
  return [...units.values()];
}

function batches(input, limits) {
  const result = [];
  const unavailable = [];
  let current = [];
  for (const unit of decisionUnits(input)) {
    const projectedDependency = projectForModel({ ...input, packages: unit }, limits);
    if (
      projectedDependency.packages.some(
        (dependency) => JSON.stringify(dependency).length > limits.maxPackageChars
      ) ||
      JSON.stringify(projectedDependency).length > limits.maxBatchChars
    ) {
      unavailable.push(...unit);
      continue;
    }
    const candidate = [...current, ...unit];
    const projected = projectForModel({ ...input, packages: candidate }, limits);
    if (
      current.length &&
      ((candidate.length > limits.maxPackagesPerBatch && unit.length === 1) ||
        JSON.stringify(projected).length > limits.maxBatchChars)
    ) {
      result.push(projectForModel({ ...input, packages: current }, limits));
      current = unit;
    } else {
      current = candidate;
    }
  }
  if (current.length) result.push(projectForModel({ ...input, packages: current }, limits));
  return { batches: result, unavailable };
}

function stricter(left, right) {
  return verdictPriority.get(left) >= verdictPriority.get(right) ? left : right;
}

function formatUpdate({ name, from, to }) {
  return `${name} ${from} to ${to}`;
}

function queueAction(group, members, coverageIssues) {
  if (!coverageIssues.length)
    return 'Rerun the advisory review after correcting the transient analysis failure for this immutable decision unit.';
  if (group.kind === 'direct')
    return `Inspect the cited direct-update evidence for ${formatUpdate(group.anchor)} and verify it accounts for all ${members.length} changed update${members.length === 1 ? '' : 's'}.`;
  return `Obtain immutable manifest, lockfile, and official package evidence for ${formatUpdate(members[0])}.`;
}

function decisionQueue(input, unavailableIds) {
  const coverageById = new Map(
    (input.coverage?.items ?? []).map((item) => [identity(item.update), item])
  );
  const grouped = new Map();
  for (const dependency of input.packages) {
    const coverage = coverageById.get(identity(dependency));
    const group = coverage?.group ?? { kind: 'standalone', anchor: null };
    const key =
      group.kind === 'direct'
        ? `direct:${identity(group.anchor)}`
        : `standalone:${identity(dependency)}`;
    const unit = grouped.get(key) ?? {
      group,
      members: [],
      coverageIssues: [],
      analysisUnavailable: false,
    };
    unit.members.push(dependency);
    if (coverage && coverage.status !== 'complete') unit.coverageIssues.push(coverage);
    if (unavailableIds.has(identity(dependency))) unit.analysisUnavailable = true;
    grouped.set(key, unit);
  }
  return [...grouped.values()]
    .filter((unit) => unit.coverageIssues.length || unit.analysisUnavailable)
    .map((unit) => ({
      group: unit.group,
      members: unit.members.map(({ name, from, to }) => ({ name, from, to })),
      count: unit.members.length,
      reason: unit.coverageIssues[0]?.reason ?? 'analysis_unavailable',
      action: queueAction(unit.group, unit.members, unit.coverageIssues),
      lifecycle: unit.coverageIssues.map(({ update, lifecycle }) => ({
        update: { name: update.name, from: update.from, to: update.to },
        ...lifecycle,
      })),
      analysisUnavailable: unit.analysisUnavailable,
    }));
}

function reviewSummary(input, unavailableIds, queue) {
  const total = input.packages.length;
  const unavailable = input.packages.filter((dependency) =>
    unavailableIds.has(identity(dependency))
  ).length;
  const analyzed = total - unavailable;
  const units = decisionUnits(input).length;
  const queued = queue.length;
  return `Reviewed ${total} dependency update${total === 1 ? '' : 's'} across ${units} decision unit${units === 1 ? '' : 's'}: ${analyzed} validated assessment${analyzed === 1 ? '' : 's'}${queued ? `; ${queued} unit${queued === 1 ? '' : 's'} await decision evidence` : ''}.`;
}

function coverageSummary(input) {
  if (!input.coverage) return undefined;
  const summary = { complete: 0, pending: 0, unresolved: 0 };
  for (const item of input.coverage.items) {
    if (item.status === 'complete') summary.complete += 1;
    if (item.status === 'pending') summary.pending += 1;
    if (item.status === 'unresolved') summary.unresolved += 1;
  }
  return summary;
}

function policyBlockers(input, unavailableIds) {
  return (input.policy?.findings ?? [])
    .filter(
      (finding) =>
        finding.verdict === 'do_not_merge' && unavailableIds.has(identity(finding.package))
    )
    .map((finding) => ({
      findingId: finding.findingId,
      reason: finding.reason,
      impact: 'Deterministic review policy requires this update not to merge.',
      evidence: [{ claim: finding.reason, sourceUrl: finding.sourceUrl }],
      remediation: finding.remediation,
      validation: finding.validation,
    }));
}

function hasEveryAssessment(batch, analysis) {
  const expected = new Set(batch.packages.map(identity));
  const actual = new Set(analysis.packageAssessments.map(identity));
  return (
    analysis.packageAssessments.length === batch.packages.length &&
    actual.size === expected.size &&
    [...actual].every((item) => expected.has(item))
  );
}

function hasExplicitNonBlockingFollowups(analysis) {
  return (
    analysis.verdict !== 'merge_with_followups' ||
    (Array.isArray(analysis.followups) &&
      analysis.followups.length > 0 &&
      analysis.followups.every((followup) => followup?.blocking === false))
  );
}

async function analyzeBatch(batch, analyze, state) {
  const timeoutMs = Math.min(state.requestTimeoutMs, state.deadline - Date.now());
  if (state.requests >= state.maxRequests || timeoutMs <= 0)
    return { analyses: [], unavailable: batch.packages };
  state.requests += 1;
  const result = await analyze(batch, { timeoutMs });
  if (result.verdict !== 'analysis_unavailable')
    return hasEveryAssessment(batch, result) && hasExplicitNonBlockingFollowups(result)
      ? { analyses: [result], unavailable: [] }
      : {
          analyses: result.verdict === 'do_not_merge' ? [result] : [],
          unavailable: batch.packages,
        };
  if (result.reason !== 'truncated' || batch.packages.length === 1)
    return { analyses: [], unavailable: batch.packages };
  const units = decisionUnits(batch);
  if (units.length === 1) return { analyses: [], unavailable: batch.packages };
  const midpoint = Math.ceil(units.length / 2);
  const leftPackages = units.slice(0, midpoint).flat();
  const rightPackages = units.slice(midpoint).flat();
  const [left, right] = await Promise.all([
    analyzeBatch(
      projectForModel({ ...batch, packages: leftPackages }, state.limits),
      analyze,
      state
    ),
    analyzeBatch(
      projectForModel({ ...batch, packages: rightPackages }, state.limits),
      analyze,
      state
    ),
  ]);
  return {
    analyses: [...left.analyses, ...right.analyses],
    unavailable: [...left.unavailable, ...right.unavailable],
  };
}

async function analyzeAll(batchList, analyze, state, maxConcurrency) {
  const results = new Map();
  let next = 0;
  async function worker() {
    while (next < batchList.length) {
      const index = next;
      next += 1;
      const batch = batchList.at(index);
      if (batch) results.set(index, await analyzeBatch(batch, analyze, state));
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(maxConcurrency, batchList.length) }, () => worker())
  );
  return batchList.map((_, index) => results.get(index));
}

export async function analyzeBatches(input, { analyzeBatch: analyze, ...options }) {
  const limits = { ...defaults, ...options };
  const state = {
    deadline: Date.now() + limits.deadlineMs,
    maxRequests: limits.maxRequests,
    requestTimeoutMs: limits.requestTimeoutMs,
    limits,
    requests: 0,
  };
  const scheduled = batches(input, limits);
  const completed = await analyzeAll(scheduled.batches, analyze, state, limits.maxConcurrency);
  const analyses = completed.flatMap((result) => result.analyses);
  const unavailable = [
    ...scheduled.unavailable,
    ...completed.flatMap((result) => result.unavailable),
  ];
  const unavailableIds = new Set(unavailable.map(identity));
  const packageAssessments = analyses.flatMap((analysis) => analysis.packageAssessments);
  const incompleteCoverage = (input.coverage?.items ?? []).some(
    (item) => item.status !== 'complete'
  );
  const deterministicBlockers = policyBlockers(input, unavailableIds);
  const blockers = [...analyses.flatMap((analysis) => analysis.blockers), ...deterministicBlockers];
  const modelVerdict = unavailable.length
    ? analyses.reduce(
        (current, analysis) => stricter(current, analysis.verdict),
        'merge_with_followups'
      )
    : analyses.reduce((current, analysis) => stricter(current, analysis.verdict), 'merge');
  const verdict = deterministicBlockers.length
    ? stricter(modelVerdict, 'do_not_merge')
    : input.coverage && (incompleteCoverage || unavailable.length)
      ? stricter(modelVerdict, 'decision_incomplete')
      : modelVerdict;
  const queue = decisionQueue(input, unavailableIds);
  const summary = reviewSummary(input, unavailableIds, queue);
  const coverage = coverageSummary(input);
  if (!analyses.length)
    return {
      verdict:
        input.coverage && !deterministicBlockers.length
          ? 'decision_incomplete'
          : 'analysis_unavailable',
      summary,
      decisionQueue: queue,
      ...(coverage ? { coverage } : {}),
      packageAssessments: [],
      blockers: [],
      remediationPrompt: null,
    };
  return {
    verdict,
    summary,
    decisionQueue: queue,
    ...(coverage ? { coverage } : {}),
    packageAssessments,
    blockers,
    remediationPrompt: null,
  };
}
