const marker = '<!-- dependabot-intelligent-review -->';
const maximumCommentChars = 50_000;
const omittedFindings =
  '_Additional lower-priority findings were omitted to fit GitHub’s comment limit._';

function escape(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function escapeFence(value) {
  return value.replaceAll('```', '``\\`');
}

function abbreviate(value, maximum = 4_000) {
  return value.length <= maximum ? value : `${value.slice(0, maximum - 1)}…`;
}

function featureLine(assessment, feature) {
  const action = feature.action
    ? ` — Action: ${escape(abbreviate(feature.action))}${
        feature.contextPath ? ` (${escape(feature.contextPath)})` : ''
      }`
    : '';
  return `- **${escape(assessment.name)}:** ${escape(abbreviate(feature.feature))} — ${escape(abbreviate(feature.rationale))} ([source](${feature.sourceUrl}))${action}`;
}

function blockerLines(analysis) {
  if (!analysis.blockers.length) return [];
  const lines = ['### Reasons not to merge'];
  for (const blocker of analysis.blockers)
    lines.push(
      `- **${escape(abbreviate(blocker.reason))}:** ${escape(abbreviate(blocker.impact))}`,
      ...blocker.evidence.map(
        (evidence) => `  - ${escape(abbreviate(evidence.claim))} ([source](${evidence.sourceUrl}))`
      ),
      ...blocker.remediation.map((step) => `  - Remediate: ${escape(abbreviate(step))}`),
      ...blocker.validation.map((step) => `  - Validate: \`${escape(abbreviate(step))}\``)
    );
  return lines;
}

function remediationLines(analysis) {
  if (analysis.remediationPrompt)
    return [
      '### Remediation prompt',
      '```text',
      escapeFence(abbreviate(analysis.remediationPrompt)),
      '```',
    ];
  return [];
}

function featureSections(assessments) {
  const features = assessments.flatMap((assessment) =>
    assessment.newFunctionality.map((feature) => ({ assessment, feature }))
  );
  const useNow = features.filter(({ feature }) => feature.usefulness === 'use_now');
  const considerLater = features.filter(({ feature }) => feature.usefulness === 'consider_later');
  const notRelevant = features.filter(({ feature }) => feature.usefulness === 'not_relevant');
  const sections = [
    [useNow, 'Use now'],
    [considerLater, 'Consider later'],
  ]
    .filter(([features]) => features.length)
    .map(([features, title]) => [
      `### ${title}`,
      ...features.map(({ assessment, feature }) => featureLine(assessment, feature)),
    ]);
  if (notRelevant.length)
    sections.push([
      '<details>',
      '<summary>Not relevant</summary>',
      '',
      ...notRelevant.map(({ assessment, feature }) => featureLine(assessment, feature)),
      '',
      '</details>',
    ]);
  return sections;
}

function appendSection(lines, section, footer) {
  const candidate = [...lines, '', ...section, '', footer].join('\n');
  if (candidate.length > maximumCommentChars) return false;
  lines.push('', ...section);
  return true;
}

function appendCriticalSection(lines, section, footer) {
  if (appendSection(lines, section, footer)) return;
  const kept = [];
  for (const line of section) {
    if ([...lines, '', ...kept, line, '', footer].join('\n').length > maximumCommentChars) break;
    kept.push(line);
  }
  if (kept.length && kept.length < section.length) {
    while (
      [...lines, '', ...kept, omittedFindings, '', footer].join('\n').length > maximumCommentChars
    )
      kept.pop();
    kept.push(omittedFindings);
  }
  if (kept.length) lines.push('', ...kept);
}

export function renderComment(analysis, headSha) {
  const footer = `Reviewed head: \`${headSha}\`. This workflow did not execute code or codemods.`;
  const verdict = analysis.verdict.replaceAll('_', ' ');
  const lines = [
    marker,
    `<!-- reviewed-head: ${headSha} -->`,
    '## Dependabot intelligent review',
    '',
    `**Advisory verdict:** ${verdict}`,
    '',
    escape(abbreviate(analysis.summary)),
  ];
  appendCriticalSection(lines, blockerLines(analysis), footer);
  const deferredSections = [
    remediationLines(analysis),
    ...featureSections(analysis.packageAssessments),
  ];
  let omitted = false;
  for (const section of deferredSections)
    if (section.length && !appendSection(lines, section, footer)) omitted = true;
  if (omitted) appendSection(lines, [omittedFindings], footer);
  lines.push('', footer);
  return lines.join('\n');
}
