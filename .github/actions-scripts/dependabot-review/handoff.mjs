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

function vettedSources(packages, item) {
  const memberIds = new Set(item.members.map(identity));
  const urls = [];
  for (const dependency of packages) {
    if (!memberIds.has(identity(dependency))) continue;
    for (const source of dependency.sources) {
      if (source.url.length <= maximumSourceUrlChars && !urls.includes(source.url))
        urls.push(source.url);
      if (urls.length === maximumSources) return urls;
    }
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
}) {
  if (!repository || !reviewDigest) return null;
  const sources = vettedSources(packages, item);
  const sourceLines = sources.length
    ? sources.map((url) => `- ${url}`)
    : ['- No bounded vetted source URL is available; state this as uncertainty.'];
  const brief = [
    'Perform read-only dependency research. Do not write to GitHub, run pull-request code, or send a response to this workflow.',
    `Pull request: https://github.com/${repository}/pull/${pullRequest.number}`,
    `Immutable head: ${pullRequest.headSha}`,
    `Review digest: ${reviewDigest}`,
    `Decision unit: ${unitLabel(item)}`,
    `Unresolved question: ${item.action} Reason: ${item.reason}.`,
    `Lifecycle facts: ${lifecycleFact(item)}`,
    `Provenance signal: ${provenanceFact(provenance)}`,
    'Vetted sources:',
    ...sourceLines,
    'Verify the exact head; if it cannot be verified, say so. Use official package or repository sources with citations. End with merge or hold for review and list remaining uncertainty.',
  ].join('\n');
  return [
    '<details>',
    `<summary>Copyable research brief: ${unitLabel(item)}</summary>`,
    '',
    '```text',
    escapeFence(brief),
    '```',
    '',
    '</details>',
  ];
}
