function markerValue(body, marker) {
  const pattern =
    marker === 'reviewed-head'
      ? /^<!-- reviewed-head: ([^\r\n]+) -->$/m
      : /^<!-- review-digest: ([^\r\n]+) -->$/m;
  const match = pattern.exec(body ?? '');
  return match?.[1] ?? null;
}

export function managedReviewMetadata(body) {
  const headSha = markerValue(body, 'reviewed-head');
  const reviewDigest = markerValue(body, 'review-digest');
  return {
    headSha,
    reviewDigest: /^[a-f0-9]{64}$/.test(reviewDigest ?? '') ? reviewDigest : null,
  };
}

export function shouldSkipAnalysis(existingComment, metadata, { refresh = false } = {}) {
  if (refresh || !existingComment) return false;
  const previous = managedReviewMetadata(existingComment.body);
  // Upstream release pages can change without a new PR commit. A validated marker
  // records that this immutable head already consumed its bounded analysis budget.
  return previous.headSha === metadata.headSha && previous.reviewDigest !== null;
}
