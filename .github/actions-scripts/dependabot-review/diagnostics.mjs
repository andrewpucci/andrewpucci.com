export function reviewDiagnostic(metadata, failureCategory) {
  return JSON.stringify({
    headSha: metadata.headSha,
    reviewDigest: metadata.reviewDigest,
    modelVersion: metadata.modelVersion,
    promptVersion: metadata.promptVersion,
    coverage: metadata.coverage,
    failureCategory,
  });
}

export function emitReviewDiagnostic(metadata, failureCategory, log = console.info) {
  log(`Dependabot review diagnostic: ${reviewDiagnostic(metadata, failureCategory)}`);
}

export function githubRequestDiagnostic(limit, { headSha, reviewDigest } = {}) {
  return JSON.stringify({
    ...(headSha ? { headSha } : {}),
    ...(reviewDigest ? { reviewDigest } : {}),
    githubRequestLimit: limit,
  });
}

export function emitGithubRequestDiagnostic(limit, metadata, log = console.info) {
  log(`GitHub request diagnostic: ${githubRequestDiagnostic(limit, metadata)}`);
}
