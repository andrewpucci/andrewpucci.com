const defaults = {
  deadlineMs: 240_000,
  maxBatchChars: 18_000,
  maxPackageChars: 5_600,
  maxPackagesPerBatch: 3,
  maxConcurrency: 2,
  maxRequests: 12,
  requestTimeoutMs: 120_000,
  maxSourceExcerptChars: 1_200,
};
const verdictPriority = new Map([
  ['merge', 0],
  ['merge_with_followups', 1],
  ['do_not_merge', 2],
]);

const identity = ({ name, from, to }) => `${name}\u0000${from}\u0000${to}`;

function projectedPackage(dependency, limits) {
  const sources = dependency.sources.map((source) => ({ ...source, excerpt: '' }));
  const overhead = JSON.stringify({ ...dependency, sources }).length;
  const available = Math.max(0, limits.maxPackageChars - overhead);
  const perSource = Math.min(
    limits.maxSourceExcerptChars,
    sources.length ? Math.floor(available / sources.length) : 0
  );
  return {
    ...dependency,
    sources: dependency.sources.map((source) => ({
      ...source,
      excerpt: source.excerpt.slice(0, perSource),
      excerptTruncated: source.excerpt.length > perSource,
    })),
  };
}

export function projectForModel(input, options = {}) {
  const limits = { ...defaults, ...options };
  return {
    ...input,
    packages: input.packages.map((dependency) => projectedPackage(dependency, limits)),
  };
}

function batches(input, limits) {
  const result = [];
  let current = [];
  for (const dependency of input.packages) {
    const candidate = [...current, dependency];
    const projected = projectForModel({ ...input, packages: candidate }, limits);
    if (
      current.length &&
      (candidate.length > limits.maxPackagesPerBatch ||
        JSON.stringify(projected).length > limits.maxBatchChars)
    ) {
      result.push(projectForModel({ ...input, packages: current }, limits));
      current = [dependency];
    } else {
      current = candidate;
    }
  }
  if (current.length) result.push(projectForModel({ ...input, packages: current }, limits));
  return result;
}

function stricter(left, right) {
  return verdictPriority.get(left) >= verdictPriority.get(right) ? left : right;
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

async function analyzeBatch(batch, analyze, state) {
  const timeoutMs = Math.min(state.requestTimeoutMs, state.deadline - Date.now());
  if (state.requests >= state.maxRequests || timeoutMs <= 0)
    return { analyses: [], unavailable: batch.packages };
  state.requests += 1;
  const result = await analyze(batch, { timeoutMs });
  if (result.verdict !== 'analysis_unavailable')
    return hasEveryAssessment(batch, result)
      ? { analyses: [result], unavailable: [] }
      : {
          analyses: result.verdict === 'do_not_merge' ? [result] : [],
          unavailable: batch.packages,
        };
  if (result.reason !== 'truncated' || batch.packages.length === 1)
    return { analyses: [], unavailable: batch.packages };
  const midpoint = Math.ceil(batch.packages.length / 2);
  const [left, right] = await Promise.all([
    analyzeBatch({ ...batch, packages: batch.packages.slice(0, midpoint) }, analyze, state),
    analyzeBatch({ ...batch, packages: batch.packages.slice(midpoint) }, analyze, state),
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
    requests: 0,
  };
  const completed = await analyzeAll(batches(input, limits), analyze, state, limits.maxConcurrency);
  const analyses = completed.flatMap((result) => result.analyses);
  const unavailable = completed.flatMap((result) => result.unavailable);
  const unavailableIds = new Set(unavailable.map(identity));
  const packageAssessments = analyses.flatMap((analysis) => analysis.packageAssessments);
  const blockers = analyses.flatMap((analysis) => analysis.blockers);
  const verdict = unavailable.length
    ? analyses.reduce(
        (current, analysis) => stricter(current, analysis.verdict),
        'merge_with_followups'
      )
    : analyses.reduce((current, analysis) => stricter(current, analysis.verdict), 'merge');
  const summary = input.packages
    .map((dependency) =>
      unavailableIds.has(identity(dependency))
        ? `${dependency.name} ${dependency.from} to ${dependency.to}: manual review required.`
        : `${dependency.name} ${dependency.from} to ${dependency.to}: analysis complete.`
    )
    .join(' ');
  if (!analyses.length)
    return {
      verdict: 'analysis_unavailable',
      summary,
      packageAssessments: [],
      blockers: [],
      remediationPrompt: null,
    };
  return {
    verdict,
    summary,
    packageAssessments,
    blockers,
    remediationPrompt: null,
  };
}
