const maximumSources = 2;
const maximumSourceUrlChars = 500;

const identity = ({ name, from, to }) => `${name}\u0000${from}\u0000${to}`;
const updateLabel = ({ name, from, to }) => `${name} ${from} to ${to}`;
const escapeFence = (value) => value.replaceAll('```', '``\\`');

function unitLabel(item) {
  if (item.group.kind === 'direct')
    return `direct update ${updateLabel(item.group.anchor)} (${item.count} changed updates)`;
  return `standalone update ${updateLabel(item.members[0])}`;
}

function lifecycleFact(item) {
  if (!item.lifecycle.length) return 'No unresolved lifecycle metadata was recorded.';
  const facts = item.lifecycle.slice(0, 2).map((lifecycle) => {
    const reason = lifecycle.reason ? `; ${lifecycle.reason}` : '';
    return `${updateLabel(lifecycle.update)}: ${lifecycle.status}/${lifecycle.metadata}${reason}`;
  });
  const remaining = item.lifecycle.length - facts.length;
  return `${facts.join('; ')}${remaining ? `; ${remaining} additional lifecycle gap${remaining === 1 ? '' : 's'}` : ''}.`;
}

function provenanceFact(provenance) {
  if (!provenance) return 'No npm provenance signal was collected.';
  return `${provenance.status}: ${provenance.invalid} invalid, ${provenance.missing} missing${provenance.reason ? `; ${provenance.reason}` : ''}.`;
}

function questionFact(item, questionLabel) {
  const reason = `Reason: ${item.reason}.`;
  return item.action.includes('\n')
    ? `${questionLabel}:\n${item.action}\n${reason}`
    : `${questionLabel}: ${item.action} ${reason}`;
}

function vettedSources(packages, item) {
  const anchor = item.group.kind === 'direct' ? item.group.anchor : item.members[0];
  const dependency = packages.find((candidate) => identity(candidate) === identity(anchor));
  const urls = [];
  for (const source of dependency?.sources ?? []) {
    if (source.url.length <= maximumSourceUrlChars && !urls.includes(source.url))
      urls.push(source.url);
    if (urls.length === maximumSources) return urls;
  }
  return urls;
}

export function renderResearchHandoff({
  repository,
  pullRequest,
  reviewDigest,
  item,
  packages,
  provenance,
  heading = 'Copyable research brief',
  questionLabel = 'Unresolved question',
}) {
  if (!repository || !reviewDigest) return null;
  const sources = vettedSources(packages, item);
  const sourceLines = sources.length
    ? sources.map((url) => `- ${url}`)
    : ['- No bounded vetted source URL is available; state this as uncertainty.'];
  const brief = [
    'Perform read-only dependency research. Do not write to GitHub, run pull-request code, or send a response to this workflow.',
    'Decide whether this upgrade is right for this repository. Do not evaluate CI status or repeat test results.',
    `Pull request: https://github.com/${repository}/pull/${pullRequest.number}`,
    `Immutable head: ${pullRequest.headSha}`,
    `Review digest: ${reviewDigest}`,
    `Decision unit: ${unitLabel(item)}`,
    questionFact(item, questionLabel),
    `Lifecycle facts: ${lifecycleFact(item)}`,
    `Provenance signal: ${provenanceFact(provenance)}`,
    'Vetted sources:',
    ...sourceLines,
    'Verify the exact head before drawing a conclusion; if it cannot be verified, say so and use hold for review. Use only official package or repository sources with citations. Do not infer repository behavior that is not visible in the PR or trusted repository context.',
    'Return exactly the following Markdown sections and nothing else:',
    '## Recommendation',
    '- Decision: `merge` or `hold for review`',
    '- Confidence: high, medium, or low',
    '- One-sentence rationale',
    '## Decision evidence',
    '- Each decision-affecting fact, its official citation, and why it applies or does not apply',
    '## Repository impact',
    '- The visible path or configuration affected, or `No evidenced repository impact`',
    '## Required action',
    '- A concrete pre-merge action, or `None`',
    '## Remaining uncertainty',
    '- Bounded uncertainty that could change the decision, or `None`',
  ].join('\n');
  return [
    '<details>',
    `<summary>${heading}: ${unitLabel(item)}</summary>`,
    '',
    '```text',
    escapeFence(brief),
    '```',
    '',
    '</details>',
  ];
}
