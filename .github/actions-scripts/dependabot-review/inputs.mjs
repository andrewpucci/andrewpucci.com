import { parseReviewInput } from './schema.mjs';

const githubRepository = (value) => {
  try {
    const url = new URL(typeof value === 'string' ? value.replace(/^git\+/, '') : value);
    if (url.protocol !== 'https:' || url.hostname !== 'github.com') return undefined;
    const [owner, repository, ...rest] = url.pathname
      .slice(1)
      .replace(/\.git$/, '')
      .split('/');
    return owner && repository && !rest.length ? `${owner}/${repository}` : undefined;
  } catch {
    return undefined;
  }
};

const isDigit = (value) => value >= '0' && value <= '9';

function concreteVersion(value) {
  const start = [...value].findIndex(isDigit);
  if (start < 0) return undefined;
  const version = value.slice(start);
  const numeric = version.split('-')[0].split('.');
  return numeric.length === 3 && numeric.every((part) => part && [...part].every(isDigit))
    ? version
    : undefined;
}

function changedPackageRanges(files) {
  const packageJson = files.find((file) => file.filename === 'package.json');
  const changes = [...(packageJson?.patch ?? '').matchAll(/^[+-]\s+"([^"]+)":\s+"([^"]+)"/gm)];
  const versions = new Map();
  for (const [, name, version] of changes)
    versions.set(name, [...(versions.get(name) ?? []), concreteVersion(version)]);
  return [...versions]
    .filter(([, versions]) => versions.length >= 2 && versions[0] && versions[1])
    .map(([name, [from, to]]) => ({
      name,
      from,
      to,
      dependencyType: 'direct:unknown',
    }));
}

async function dependencyChanges(event, fetchLike, githubHeaders) {
  if (typeof event.repository !== 'string') return [];
  const { base, head } = event.pull_request;
  const url = `https://api.github.com/repos/${event.repository}/dependency-graph/compare/${base.sha}...${head.sha}`;
  try {
    const response = await fetchLike(url, { headers: githubHeaders });
    if (!response.ok) return [];
    const body = await response.json();
    return Array.isArray(body) ? body : [];
  } catch {
    return [];
  }
}

function dependabotVersions(body) {
  if (typeof body !== 'string') return new Map();
  return new Map(
    [...body.matchAll(/Updates `([^`]+)` from ([^\s`]+) to ([^\s`]+)/g)].map(
      ([, name, from, to]) => [name, { from, to }]
    )
  );
}

function workflowActionUpdates(files, dependabotUpdates) {
  const updates = new Map();
  for (const file of files) {
    if (typeof file?.filename !== 'string' || typeof file.patch !== 'string') continue;
    for (const [, name] of file.patch.matchAll(/^[+-]\s*uses:\s*['"]?([^@\s'"]+)@/gm)) {
      const version = dependabotUpdates.get(name);
      if (!version) continue;
      updates.set(name, {
        name,
        manifest: file.filename,
        ecosystem: 'actions',
        from: version.from,
        to: version.to,
      });
    }
  }
  return updates;
}

function dependencyUpdates(changes, dependabotUpdates, workflowActions) {
  const updates = new Map();
  for (const change of changes) {
    if (!['npm', 'actions'].includes(change?.ecosystem) || typeof change.name !== 'string')
      continue;
    const actionVersion = dependabotUpdates.get(change.name);
    if (change.ecosystem === 'actions' && !actionVersion) continue;
    const key = change.ecosystem === 'actions' ? change.name : `${change.manifest}:${change.name}`;
    const update = updates.get(key) ?? {
      name: change.name,
      manifest: change.manifest,
      ecosystem: change.ecosystem,
    };
    if (change.change_type === 'removed') update.from = actionVersion?.from ?? change.version;
    if (change.change_type === 'added')
      Object.assign(update, { to: actionVersion?.to ?? change.version, change });
    updates.set(key, update);
  }
  for (const [name, action] of workflowActions) if (!updates.has(name)) updates.set(name, action);
  return [...updates.values()]
    .filter(({ from, to }) => typeof from === 'string' && typeof to === 'string')
    .map(({ name, manifest, ecosystem, from, to, change }) => ({
      name,
      from,
      to,
      dependencyType:
        ecosystem === 'actions'
          ? 'direct:workflow'
          : manifest === 'package.json'
            ? 'direct:unknown'
            : 'transitive',
      ecosystem,
      repository:
        githubRepository(change?.source_repository_url) ??
        (ecosystem === 'actions' ? name : undefined),
      license: typeof change?.license === 'string' ? change.license : null,
      vulnerabilities: Array.isArray(change?.vulnerabilities) ? change.vulnerabilities : [],
    }));
}

function hasApplicableRange(excerpt, from, to) {
  const text = excerpt.toLowerCase();
  const sources = [from, `v${from}`];
  const targets = [to, `v${to}`];
  return sources.some((source) =>
    targets.some(
      (target) =>
        text.includes(`from ${source} to ${target}`) ||
        text.includes(`from ${source} through ${target}`) ||
        text.includes(`${source} → ${target}`) ||
        text.includes(`${source} -> ${target}`)
    )
  );
}

async function json(response) {
  return response.ok ? response.json() : null;
}

export async function collectReviewInput(event, { fetchLike = fetch, githubHeaders = {} } = {}) {
  const pullRequest = event.pull_request;
  if (pullRequest?.user?.login !== 'dependabot[bot]') return null;
  const changes = await dependencyChanges(event, fetchLike, githubHeaders);
  const dependabotUpdates = dependabotVersions(pullRequest.body);
  const updates = dependencyUpdates(
    changes,
    dependabotUpdates,
    workflowActionUpdates(event.files ?? [], dependabotUpdates)
  );
  const packages = await Promise.all(
    (updates.length ? updates : changedPackageRanges(event.files ?? [])).map(async (dependency) => {
      const metadata =
        dependency.ecosystem === 'actions'
          ? null
          : await fetchLike(
              `https://registry.npmjs.org/${encodeURIComponent(dependency.name)}`
            ).then(json);
      const repository = dependency.repository ?? githubRepository(metadata?.repository?.url);
      let source = null;
      if (repository) {
        const release = await fetchLike(
          `https://api.github.com/repos/${repository}/releases/tags/v${dependency.to}`,
          { headers: githubHeaders }
        ).then(json);
        if (release?.html_url && typeof release.body === 'string')
          source = {
            kind: 'release-notes',
            url: release.html_url,
            title: release.name || `${dependency.name} ${dependency.to}`,
            excerpt: release.body.slice(0, 12_000),
          };
      }
      const command = source?.excerpt.match(
        /(?:npx|pnpm dlx|yarn dlx)\s+[^\n`]+(?:codemod|migrate)[^\n`]*/i
      )?.[0];
      const findings =
        command && hasApplicableRange(source.excerpt, dependency.from, dependency.to)
          ? [
              {
                id: `${dependency.name}:applicable-codemod:${source.url}`,
                kind: 'applicable-codemod',
                reason: `Run the upstream codemod for ${dependency.name}.`,
                sourceUrl: source.url,
                remediation: [command],
                validation: ['npm run check', 'npm test'],
                codemodCommand: command,
              },
            ]
          : [];
      const vulnerabilitySources = dependency.vulnerabilities
        .filter((vulnerability) => typeof vulnerability?.advisory_url === 'string')
        .map((vulnerability) => ({
          kind: 'github-advisory',
          url: vulnerability.advisory_url,
          title: vulnerability.advisory_ghsa_id || `${dependency.name} vulnerability`,
          excerpt:
            vulnerability.advisory_summary || 'GitHub dependency review reported a vulnerability.',
        }));
      for (const vulnerability of vulnerabilitySources)
        findings.push({
          id: `${dependency.name}:vulnerability:${vulnerability.url}`,
          kind: 'vulnerability',
          reason: `GitHub dependency review reported a vulnerability in ${dependency.name}.`,
          sourceUrl: vulnerability.url,
          remediation: [`Review and remediate ${vulnerability.title}.`],
          validation: ['npm run check', 'npm test'],
        });
      return {
        name: dependency.name,
        from: dependency.from,
        to: dependency.to,
        dependencyType: dependency.dependencyType,
        license: dependency.license ?? null,
        sources: [...vulnerabilitySources, ...(source ? [source] : [])],
        findings,
      };
    })
  );
  if (!packages.length) return null;
  return parseReviewInput({
    pullRequest: {
      number: pullRequest.number,
      baseSha: pullRequest.base.sha,
      headSha: pullRequest.head.sha,
    },
    packages,
  });
}
