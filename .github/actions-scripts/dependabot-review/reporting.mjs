const marker = '<!-- dependabot-intelligent-review -->';

function escape(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function escapeFence(value) {
  return value.replaceAll('```', '``\\`');
}

function featureLine(assessment, feature) {
  return `- **${escape(assessment.name)}:** ${escape(feature.feature)} — ${escape(feature.rationale)} ([source](${feature.sourceUrl}))`;
}

function renderBlockers(lines, analysis) {
  if (!analysis.blockers.length) return;
  lines.push('', '### Reasons not to merge');
  for (const blocker of analysis.blockers)
    lines.push(
      `- **${escape(blocker.reason)}:** ${escape(blocker.impact)}`,
      ...blocker.evidence.map(
        (evidence) => `  - ${escape(evidence.claim)} ([source](${evidence.sourceUrl}))`
      ),
      ...blocker.remediation.map((step) => `  - Remediate: ${escape(step)}`),
      ...blocker.validation.map((step) => `  - Validate: \`${escape(step)}\``)
    );
  if (analysis.remediationPrompt)
    lines.push(
      '',
      '### Remediation prompt',
      '```text',
      escapeFence(analysis.remediationPrompt),
      '```'
    );
}

function renderFeatures(lines, assessments) {
  const features = assessments.flatMap((assessment) =>
    assessment.newFunctionality.map((feature) => ({ assessment, feature }))
  );
  const useNow = features.filter(({ feature }) => feature.usefulness === 'use_now');
  const considerLater = features.filter(({ feature }) => feature.usefulness === 'consider_later');
  const notRelevant = features.filter(({ feature }) => feature.usefulness === 'not_relevant');
  const groups = [
    [useNow, 'Use now'],
    [considerLater, 'Consider later'],
  ];
  for (const [features, title] of groups)
    if (features.length)
      lines.push(
        '',
        `### ${title}`,
        ...features.map(({ assessment, feature }) => featureLine(assessment, feature))
      );
  if (notRelevant.length)
    lines.push(
      '',
      '<details>',
      '<summary>Not relevant</summary>',
      '',
      ...notRelevant.map(({ assessment, feature }) => featureLine(assessment, feature)),
      '',
      '</details>'
    );
}

export function renderComment(analysis, headSha) {
  const verdict = analysis.verdict.replaceAll('_', ' ');
  const lines = [
    marker,
    `<!-- reviewed-head: ${headSha} -->`,
    '## Dependabot intelligent review',
    '',
    `**Advisory verdict:** ${verdict}`,
    '',
    escape(analysis.summary),
  ];
  renderBlockers(lines, analysis);
  renderFeatures(lines, analysis.packageAssessments);
  lines.push('', `Reviewed head: \`${headSha}\`. This workflow did not execute code or codemods.`);
  return lines.join('\n').slice(0, 50_000);
}
