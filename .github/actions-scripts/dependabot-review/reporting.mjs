import { renderResearchHandoff } from './handoff.mjs';

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

function updateLabel({ name, from, to }) {
  return `${name} ${from} to ${to}`;
}

function nextAction(analysis) {
  if (analysis.verdict === 'decision_incomplete')
    return 'No merge recommendation is available. Complete every item in the Decision queue.';
  if (analysis.verdict === 'do_not_merge')
    return 'Do not merge until the documented blockers are remediated and validated.';
  if (analysis.verdict === 'merge_with_followups')
    return 'Merge is advisory only after recording the explicit non-blocking follow-ups.';
  if (analysis.verdict === 'analysis_unavailable')
    return 'No merge recommendation is available. Rerun the advisory review after correcting the failure.';
  return 'The evidence supports an advisory merge recommendation.';
}

function reasonLabel(reason) {
  if (reason === 'coverage_inputs_unavailable')
    return 'Immutable coverage inputs were unavailable.';
  if (reason === 'github_rate_limited')
    return 'GitHub API rate limiting stopped source collection.';
  if (reason === 'github_request_budget_exhausted')
    return 'The bounded GitHub request budget stopped source collection.';
  if (reason === 'analysis_unavailable') return 'Bounded model analysis was unavailable.';
  return reason;
}

function decisionQueueLines(analysis) {
  if (!analysis.decisionQueue?.length) return [];
  const lines = ['### Decision queue'];
  for (const item of analysis.decisionQueue) {
    const relationship =
      item.group.kind === 'direct'
        ? `Direct update ${updateLabel(item.group.anchor)}`
        : `Standalone update ${updateLabel(item.members[0])}`;
    lines.push(
      `- **${escape(relationship)}** (${item.count} changed update${item.count === 1 ? '' : 's'}): ${escape(abbreviate(item.action, 600))}`,
      `  - Evidence gap: ${escape(abbreviate(reasonLabel(item.reason), 280))}`
    );
  }
  return lines;
}

function coverageLines(analysis) {
  if (!analysis.coverage) return [];
  const { complete, pending, unresolved } = analysis.coverage;
  const total = complete + pending + unresolved;
  return [
    '### Decision coverage',
    `- ${total} changed update${total === 1 ? '' : 's'}: ${complete} complete, ${pending} pending, ${unresolved} unresolved. Grouping supplies scope evidence; it is not a claim that every member was individually researched.`,
  ];
}

function provenanceLines(provenance) {
  if (!provenance) return [];
  const reason = provenance.reason ? ` ${provenance.reason}` : '';
  return [
    '### Advisory provenance',
    `- **${escape(provenance.status)}:** ${provenance.invalid} invalid, ${provenance.missing} missing.${escape(abbreviate(reason, 280))}`,
  ];
}

function followupLines(analysis) {
  if (!analysis.followups?.length) return [];
  return [
    '### Non-blocking follow-ups',
    ...analysis.followups.map((followup) => `- ${escape(abbreviate(followup.description, 280))}`),
  ];
}

function handoffSections(analysis, metadata) {
  if (!analysis.decisionQueue?.length || !metadata.repository || !metadata.reviewDigest) return [];
  return analysis.decisionQueue
    .map((item) =>
      renderResearchHandoff({
        repository: metadata.repository,
        pullRequest: metadata.pullRequest,
        reviewDigest: metadata.reviewDigest,
        item,
        packages: metadata.packages,
        provenance: metadata.provenance,
      })
    )
    .filter(Boolean);
}

function featureSections(assessments) {
  const features = assessments.flatMap((assessment) =>
    assessment.newFunctionality.map((feature) => ({ assessment, feature }))
  );
  const useNow = features.filter(({ feature }) => feature.usefulness === 'use_now');
  const considerLater = features.filter(({ feature }) => feature.usefulness === 'consider_later');
  const notRelevant = features.filter(({ feature }) => feature.usefulness === 'not_relevant');
  const sections = [
    [useNow, 'New capabilities to adopt now'],
    [considerLater, 'New capabilities to consider later'],
  ]
    .filter(([features]) => features.length)
    .map(([features, title]) => [
      `### ${title}`,
      ...features.map(({ assessment, feature }) => featureLine(assessment, feature)),
    ]);
  if (notRelevant.length)
    sections.push([
      '<details>',
      '<summary>New capabilities not relevant here</summary>',
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

function appendRequiredSection(lines, section, footer) {
  if (!section.length) return;
  if (!appendSection(lines, section, footer))
    throw new RangeError('The complete Dependabot decision queue exceeds GitHub’s comment limit.');
}

export function renderComment(analysis, value) {
  const metadata = typeof value === 'string' ? { headSha: value } : value;
  const { headSha, reviewDigest } = metadata;
  const footer = `Reviewed head: \`${headSha}\`. This workflow did not execute code or codemods.`;
  const verdict = analysis.verdict.replaceAll('_', ' ');
  const lines = [
    marker,
    `<!-- reviewed-head: ${headSha} -->`,
    ...(reviewDigest ? [`<!-- review-digest: ${reviewDigest} -->`] : []),
    '## Dependabot intelligent review',
    '',
    `**Advisory verdict:** ${verdict}`,
    `**Next action:** ${nextAction(analysis)}`,
    '',
    escape(abbreviate(analysis.summary)),
  ];
  appendRequiredSection(lines, decisionQueueLines(analysis), footer);
  appendCriticalSection(lines, blockerLines(analysis), footer);
  const deferredSections = [
    coverageLines(analysis),
    provenanceLines(metadata.provenance),
    followupLines(analysis),
    remediationLines(analysis),
    ...handoffSections(analysis, metadata),
    ...featureSections(analysis.packageAssessments),
  ];
  let omitted = false;
  for (const section of deferredSections)
    if (section.length && !appendSection(lines, section, footer)) omitted = true;
  if (omitted) appendSection(lines, [omittedFindings], footer);
  lines.push('', footer);
  return lines.join('\n');
}
