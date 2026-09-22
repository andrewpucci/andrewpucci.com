import { fetchAllPages } from './github.mjs';

function concreteVersion(value) {
  const start = [...value].findIndex((character) => character >= '0' && character <= '9');
  if (start < 0) return undefined;
  const version = value.slice(start);
  const numeric = version.split('-')[0].split('.');
  return numeric.length === 3 && numeric.every((part) => part && [...part].every(isDigit))
    ? version
    : undefined;
}

const isDigit = (value) => value >= '0' && value <= '9';

async function fetchJson(fetchLike, url, options, onFailure) {
  try {
    const response = await fetchLike(url, options);
    if (!response.ok) {
      if (response.status !== 404) onFailure();
      return null;
    }
    return await response.json();
  } catch {
    onFailure();
    return null;
  }
}

async function targetRelease(repository, dependency, fetchLike, githubHeaders, onFailure) {
  for (const tag of [`v${dependency.to}`, dependency.to]) {
    const release = await fetchJson(
      fetchLike,
      `https://api.github.com/repos/${repository}/releases/tags/${encodeURIComponent(tag)}`,
      { headers: githubHeaders },
      onFailure
    );
    if (release?.html_url && typeof release.body === 'string')
      return {
        kind: 'release-notes',
        url: release.html_url,
        title: release.name || `${dependency.name} ${dependency.to}`,
        excerpt: release.body.slice(0, 12_000),
        range: { from: dependency.from, to: dependency.to },
      };
  }
  return null;
}

async function rangeCompare(repository, dependency, fetchLike, githubHeaders, onFailure) {
  for (const fromTag of [`v${dependency.from}`, dependency.from])
    for (const toTag of [`v${dependency.to}`, dependency.to]) {
      const comparison = await fetchJson(
        fetchLike,
        `https://api.github.com/repos/${repository}/compare/${encodeURIComponent(fromTag)}...${encodeURIComponent(toTag)}`,
        { headers: githubHeaders },
        onFailure
      );
      if (typeof comparison?.html_url !== 'string') continue;
      const commits = Array.isArray(comparison.commits) ? comparison.commits : [];
      const excerpt = commits
        .map((commit) => commit?.commit?.message)
        .filter((message) => typeof message === 'string')
        .join('\n')
        .slice(0, 12_000);
      return {
        kind: 'repository-compare',
        url: comparison.html_url,
        title: `${dependency.name} ${dependency.from} to ${dependency.to}`,
        excerpt: excerpt || `GitHub compared ${dependency.from} to ${dependency.to}.`,
        range: { from: dependency.from, to: dependency.to },
      };
    }
  return null;
}

function versionParts(value) {
  const version = concreteVersion(value);
  return version?.split('-')[0].split('.').map(Number);
}

function compareVersions(left, right) {
  for (let index = 0; index < left.length; index += 1) {
    const leftPart = left.at(index);
    const rightPart = right.at(index);
    if (leftPart < rightPart) return -1;
    if (leftPart > rightPart) return 1;
  }
  return 0;
}

function withinRange(version, from, to) {
  const candidate = versionParts(version);
  const lower = versionParts(from);
  const upper = versionParts(to);
  return (
    candidate &&
    lower &&
    upper &&
    compareVersions(candidate, lower) >= 0 &&
    compareVersions(candidate, upper) <= 0
  );
}

function isDependencyReleaseTag(tag, dependency) {
  const version = concreteVersion(tag);
  return (
    version &&
    [
      version,
      `v${version}`,
      `${dependency.name}@${version}`,
      `${dependency.name}@v${version}`,
    ].includes(tag)
  );
}

async function rangeReleases(repository, dependency, fetchLike, githubHeaders, onFailure) {
  let releases;
  try {
    releases = await fetchAllPages({
      api: `https://api.github.com/repos/${repository}/releases?per_page=100`,
      headers: githubHeaders,
      fetchLike,
      action: 'retrieve upstream releases',
    });
  } catch (error) {
    if (!/\(404\)/.test(error instanceof Error ? error.message : '')) onFailure();
    return [];
  }
  return releases
    .filter(
      (release) =>
        typeof release?.tag_name === 'string' &&
        typeof release.html_url === 'string' &&
        typeof release.body === 'string' &&
        isDependencyReleaseTag(release.tag_name, dependency) &&
        withinRange(release.tag_name, dependency.from, dependency.to)
    )
    .slice(0, 5)
    .map((release) => {
      const version = concreteVersion(release.tag_name);
      return {
        kind: 'release-notes',
        url: release.html_url,
        title: release.name || `${dependency.name} ${version}`,
        excerpt: release.body.slice(0, 12_000),
        range: { from: version, to: version },
      };
    });
}

async function changelogSource(repository, dependency, fetchLike, githubHeaders, onFailure) {
  for (const tag of [`v${dependency.to}`, dependency.to]) {
    const changelog = await fetchJson(
      fetchLike,
      `https://api.github.com/repos/${repository}/contents/CHANGELOG.md?ref=${encodeURIComponent(tag)}`,
      { headers: githubHeaders },
      onFailure
    );
    if (changelog?.encoding !== 'base64' || typeof changelog.content !== 'string') continue;
    const excerpt = Buffer.from(changelog.content, 'base64').toString('utf8').slice(0, 12_000);
    if (!excerpt) continue;
    return {
      kind: 'changelog',
      url:
        typeof changelog.html_url === 'string'
          ? changelog.html_url
          : `https://github.com/${repository}/blob/${encodeURIComponent(tag)}/CHANGELOG.md`,
      title: `${dependency.name} ${dependency.from} to ${dependency.to} changelog`,
      excerpt,
      range: { from: dependency.from, to: dependency.to },
    };
  }
  return null;
}

export async function collectUpstreamEvidence({
  repository,
  dependency,
  fetchLike,
  githubHeaders,
}) {
  let collectionFailed = false;
  const recordFailure = () => {
    collectionFailed = true;
  };
  if (repository) {
    const source = await targetRelease(
      repository,
      dependency,
      fetchLike,
      githubHeaders,
      recordFailure
    );
    if (source)
      return {
        status: 'available',
        availability: 'available',
        reason: null,
        sources: [source],
      };
    const comparison = await rangeCompare(
      repository,
      dependency,
      fetchLike,
      githubHeaders,
      recordFailure
    );
    if (comparison)
      return {
        status: 'available',
        availability: 'available',
        reason: null,
        sources: [comparison],
      };
    const releases = await rangeReleases(
      repository,
      dependency,
      fetchLike,
      githubHeaders,
      recordFailure
    );
    if (releases.length)
      return {
        status: 'partial',
        availability: 'available',
        reason: 'Only releases within the version range were available.',
        sources: releases,
      };
    const changelog = await changelogSource(
      repository,
      dependency,
      fetchLike,
      githubHeaders,
      recordFailure
    );
    if (changelog)
      return {
        status: 'partial',
        availability: 'available',
        reason: 'Only the upstream changelog was available for this version range.',
        sources: [changelog],
      };
  }
  return {
    status: 'unavailable',
    availability: collectionFailed ? 'collection_failed' : 'not_published',
    reason: collectionFailed
      ? 'Upstream upgrade evidence could not be collected.'
      : repository
        ? 'No upstream release, comparison, or changelog was available for this version range.'
        : 'No attributable upstream repository was available for this dependency.',
    sources: [],
  };
}
