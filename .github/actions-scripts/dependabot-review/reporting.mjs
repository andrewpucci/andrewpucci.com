const marker = '<!-- dependabot-intelligent-review -->';

function escape(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
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
  if (analysis.packageAssessments.length) {
    lines.push('', '### What this update enables');
    for (const assessment of analysis.packageAssessments)
      for (const feature of assessment.newFunctionality)
        lines.push(
          `- **${escape(assessment.name)}:** ${escape(feature.feature)} — ${escape(feature.rationale)} ([source](${feature.sourceUrl}))`
        );
  }
  if (analysis.blockers.length) {
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
        analysis.remediationPrompt.replaceAll('```', '``\\`'),
        '```'
      );
  }
  lines.push('', `Reviewed head: \`${headSha}\`. This workflow did not execute code or codemods.`);
  return lines.join('\n').slice(0, 50_000);
}
