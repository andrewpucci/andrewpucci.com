import { renderResearchHandoff } from './handoff.mjs';

const marker = '<!-- dependabot-intelligent-review -->';
const maximumCommentChars = 50_000;
const maximumFollowupUnits = 8;
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
  if (reason === 'analysis_invalid_response')
    return 'Mistral did not produce a schema-valid analysis after one retry.';
  if (reason === 'analysis_schema_assessment_cardinality')
    return 'Mistral returned an incomplete set of decision assessments after one retry.';
  if (reason === 'analysis_schema_unknown_evidence_url')
    return 'Mistral cited evidence outside the immutable review packet after one retry.';
  if (reason === 'analysis_schema_unknown_package')
    return 'Mistral referenced an unknown package or decision unit after one retry.';
  if (reason === 'analysis_schema_followup_contract')
    return 'Mistral follow-ups did not match its advisory verdict after one retry.';
  if (reason === 'analysis_schema_blocker_contract')
    return 'Mistral blockers did not match verified immutable findings after one retry.';
  if (reason === 'analysis_schema_policy_ceiling')
    return 'Mistral returned a verdict less restrictive than immutable policy after one retry.';
  if (reason === 'analysis_schema_verdict_contract')
    return 'Mistral returned an unsupported advisory verdict after one retry.';
  if (reason === 'analysis_schema_decision_shape')
    return 'Mistral omitted or malformed required decision fields after one retry.';
  if (reason === 'analysis_schema_contract')
    return 'Mistral did not satisfy the bounded decision-analysis contract after one retry.';
  if (reason === 'analysis_invalid_json')
    return 'Mistral did not return valid JSON after one retry.';
  if (reason === 'analysis_packet_too_large')
    return 'The bounded Mistral input packet was too large for this decision unit.';
  if (reason === 'analysis_request_budget_exhausted')
    return 'The bounded Mistral request budget was exhausted before analysis.';
  if (reason === 'analysis_deadline_exceeded')
    return 'The bounded Mistral analysis deadline elapsed before this unit could run.';
  if (reason === 'analysis_transport_failure')
    return 'Mistral could not be reached for this bounded analysis.';
  if (reason === 'analysis_http_failure') return 'Mistral returned an unavailable API response.';
  if (reason === 'analysis_api_response_invalid')
    return 'Mistral returned an invalid API response envelope.';
  if (reason === 'analysis_truncated') return 'Mistral truncated this bounded analysis.';
  if (reason === 'analysis_incomplete_response')
    return 'Mistral omitted required decision coverage from its analysis.';
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

function followupUnitKey(researchUnit, description) {
  if (!researchUnit) return `description:${description}`;
  const anchor =
    researchUnit.group.kind === 'direct' ? researchUnit.group.anchor : researchUnit.members[0];
  return `${researchUnit.group.kind}:${updateLabel(anchor)}`;
}

function followupUnitLabel(researchUnit) {
  if (!researchUnit) return null;
  if (researchUnit.group.kind === 'direct')
    return `Direct update ${updateLabel(researchUnit.group.anchor)}`;
  return `Standalone update ${updateLabel(researchUnit.members[0])}`;
}

function followupUnits(analysis) {
  const units = new Map();
  for (const { description, researchUnit } of analysis.followups ?? []) {
    const key = followupUnitKey(researchUnit, description);
    const unit = units.get(key);
    if (unit) {
      if (!unit.followups.includes(description)) unit.followups.push(description);
      continue;
    }
    units.set(key, { researchUnit, followups: [description] });
  }
  return [...units.values()].slice(0, maximumFollowupUnits);
}

function followupLines(analysis) {
  if (analysis.verdict !== 'merge_with_followups' || !analysis.followups?.length) return [];
  return [
    '### Non-blocking follow-ups',
    ...followupUnits(analysis).map(({ researchUnit, followups }) => {
      const label = followupUnitLabel(researchUnit);
      const prefix = label ? `**${escape(label)}:** ` : '';
      return `- ${prefix}${escape(abbreviate(followups.join(' '), 280))}`;
    }),
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

function followupHandoffSections(analysis, metadata) {
  if (analysis.verdict !== 'merge_with_followups' || !metadata.repository || !metadata.reviewDigest)
    return [];
  const prompts = followupUnits(analysis)
    .filter(({ researchUnit }) => researchUnit)
    .map(({ researchUnit, followups }) =>
      renderResearchHandoff({
        repository: metadata.repository,
        pullRequest: metadata.pullRequest,
        reviewDigest: metadata.reviewDigest,
        item: {
          ...researchUnit,
          reason: 'non_blocking_followup',
          action:
            followups.length === 1
              ? followups[0]
              : followups.map((description) => `- ${description}`).join('\n'),
          lifecycle: [],
        },
        packages: metadata.packages,
        provenance: metadata.provenance,
        heading: 'Copyable research prompt',
        questionLabel: 'Follow-up to investigate',
      })
    )
    .filter(Boolean);
  return prompts.length ? [['### Research prompts'], ...prompts] : [];
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
    ...followupHandoffSections(analysis, metadata),
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
