import { createHash } from 'node:crypto';

export const modelVersion = 'mistral-medium-latest';
export const promptVersion = 'dependabot-review-v2';

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, canonicalize(item)])
  );
}

export function canonicalReviewPacket(input, policy) {
  return canonicalize({
    format: 1,
    pullRequest: input.pullRequest,
    packages: input.packages,
    coverage: input.coverage ?? null,
    provenance: input.provenance ?? null,
    policy,
  });
}

function coverageCounts(input) {
  const counts = { complete: 0, pending: 0, unresolved: 0 };
  for (const item of input.coverage?.items ?? []) {
    if (item.status === 'complete') counts.complete += 1;
    if (item.status === 'pending') counts.pending += 1;
    if (item.status === 'unresolved') counts.unresolved += 1;
  }
  return counts;
}

export function createReviewMetadata(input, policy, { repository } = {}) {
  const reviewDigest = createHash('sha256')
    .update(JSON.stringify(canonicalReviewPacket(input, policy)))
    .digest('hex');
  return {
    headSha: input.pullRequest.headSha,
    reviewDigest,
    modelVersion,
    promptVersion,
    coverage: coverageCounts(input),
    ...(repository ? { repository } : {}),
  };
}
