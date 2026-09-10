import { isVulnerabilitySeverity, parseReviewInput } from './schema.mjs';
import { collectNpmCoverage } from './coverage.mjs';
import { collectLifecycleScripts } from './lifecycle.mjs';
import { collectRepositoryContext } from './context.mjs';
import { collectProvenance } from './provenance.mjs';
import { collectUpstreamEvidence } from './upstream-evidence.mjs';

const provenanceUnavailable = (reason) => ({
  status: 'unavailable',
  invalid: 0,
  missing: 0,
  reason,
});

async function fetchImmutableContent({ repository, refSha, path, fetchLike, githubHeaders }) {
  const response = await fetchLike(
    `https://api.github.com/repos/${repository}/contents/${path}?ref=${encodeURIComponent(refSha)}`,
    { headers: githubHeaders }
  );
  if (!response.ok) throw new Error('GitHub contents request failed');
  const body = await response.json();
  if (body?.encoding !== 'base64' || typeof body.content !== 'string')
    throw new TypeError('GitHub contents response was invalid');
  return Buffer.from(body.content, 'base64').toString('utf8');
}

export async function collectPullRequestProvenance(
  { repository, headSha },
  { fetchLike = fetch, githubHeaders = {}, collectProvenance: collect = collectProvenance } = {}
) {
  let lockfile;
  let manifestText;
  try {
    [lockfile, manifestText] = await Promise.all([
      fetchImmutableContent({
        repository,
        refSha: headSha,
        path: 'package-lock.json',
        fetchLike,
        githubHeaders,
      }),
      fetchImmutableContent({
        repository,
        refSha: headSha,
        path: 'package.json',
        fetchLike,
        githubHeaders,
      }),
    ]);
  } catch {
    return provenanceUnavailable('The pull request provenance inputs could not be retrieved.');
  }
  let overrides;
  try {
    const manifest = JSON.parse(manifestText);
    if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest))
      throw new TypeError('package manifest was invalid');
    const { overrides: manifestOverrides } = manifest;
    overrides = manifestOverrides;
  } catch {
    return provenanceUnavailable('The pull request provenance inputs could not be safely parsed.');
  }
  try {
    return await collect({ lockfile, overrides });
  } catch {
    return provenanceUnavailable('The pull request provenance could not be collected.');
  }
}

export async function collectNpmCoverageInput(
  { repository, baseSha, headSha },
  updates,
  { fetchLike = fetch, githubHeaders = {} } = {}
) {
  const npmUpdates = updates.filter((update) => update.ecosystem === 'npm');
  if (!npmUpdates.length) return undefined;
  try {
    const [baseLockfileText, headLockfileText, baseManifestText, headManifestText] =
      await Promise.all([
        fetchImmutableContent({
          repository,
          refSha: baseSha,
          path: 'package-lock.json',
          fetchLike,
          githubHeaders,
        }),
        fetchImmutableContent({
          repository,
          refSha: headSha,
          path: 'package-lock.json',
          fetchLike,
          githubHeaders,
        }),
        fetchImmutableContent({
          repository,
          refSha: baseSha,
          path: 'package.json',
          fetchLike,
          githubHeaders,
        }),
        fetchImmutableContent({
          repository,
          refSha: headSha,
          path: 'package.json',
          fetchLike,
          githubHeaders,
        }),
      ]);
    return collectLifecycleScripts(
      collectNpmCoverage({
        updates: npmUpdates,
        baseManifest: JSON.parse(baseManifestText),
        headManifest: JSON.parse(headManifestText),
        baseLockfile: JSON.parse(baseLockfileText),
        headLockfile: JSON.parse(headLockfileText),
      }),
      { fetchLike }
    );
  } catch {
    return collectNpmCoverage({ updates: npmUpdates });
  }
}

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

function dependencyUpdates(changes, dependabotUpdates, workflowActions, directDependencies) {
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
      Object.assign(update, {
        to: actionVersion?.to ?? change.version,
        change,
      });
    updates.set(key, update);
  }
  for (const [name, action] of workflowActions) if (!updates.has(name)) updates.set(name, action);
  return [...updates.values()]
    .filter(({ from, to }) => typeof from === 'string' && typeof to === 'string')
    .map(({ name, ecosystem, from, to, change }) => ({
      name,
      from,
      to,
      dependencyType:
        ecosystem === 'actions'
          ? 'direct:workflow'
          : directDependencies.has(name)
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

async function fetchJson(fetchLike, url, options) {
  try {
    return await fetchLike(url, options).then(json);
  } catch {
    return null;
  }
}

const updateIdentity = ({ name, from, to }) => `${name}\u0000${from}\u0000${to}`;

function groupBacked(coverage, dependency) {
  return (
    coverage?.group.kind === 'direct' &&
    updateIdentity(coverage.group.anchor) !== updateIdentity(dependency)
  );
}

function githubLimitReason(limit) {
  return limit?.status === 'request_budget_exhausted'
    ? 'github_request_budget_exhausted'
    : 'github_rate_limited';
}

function limitedCoverage(coverage, rateLimitedTargets) {
  if (!coverage || !rateLimitedTargets.size) return coverage;
  return {
    items: coverage.items.map((item) => {
      const target =
        item.group.kind === 'direct'
          ? updateIdentity(item.group.anchor)
          : updateIdentity(item.update);
      const limit = rateLimitedTargets.get(target);
      return limit ? { ...item, status: 'unresolved', reason: githubLimitReason(limit) } : item;
    }),
  };
}

/**
 * @param {{ pull_request?: unknown, repository?: unknown, files?: unknown[] }} event
 * @param {{ fetchLike?: typeof fetch, githubHeaders?: HeadersInit, repositoryContext?: { paths: string[], readFile: (path: string) => Promise<string> }, collectCoverage?: boolean, collectNpmCoverage?: typeof collectNpmCoverageInput, githubRequestDiagnostic?: () => { limit?: unknown } }} options
 */
export async function collectReviewInput(
  event,
  {
    fetchLike = fetch,
    githubHeaders = {},
    repositoryContext,
    collectCoverage = false,
    collectNpmCoverage = collectNpmCoverageInput,
    githubRequestDiagnostic = () => ({}),
  } = {}
) {
  const pullRequest = event.pull_request;
  if (pullRequest?.user?.login !== 'dependabot[bot]') return null;
  const changes = await dependencyChanges(event, fetchLike, githubHeaders);
  const dependabotUpdates = dependabotVersions(pullRequest.body);
  const directDependencies = new Set(
    changedPackageRanges(event.files ?? []).map(({ name }) => name)
  );
  const updates = dependencyUpdates(
    changes,
    dependabotUpdates,
    workflowActionUpdates(event.files ?? [], dependabotUpdates),
    directDependencies
  );
  const reviewUpdates = updates.length
    ? updates
    : changedPackageRanges(event.files ?? []).map((dependency) => ({
        ...dependency,
        ecosystem: 'npm',
      }));
  const npmCoverage = collectCoverage
    ? await collectNpmCoverage(
        {
          repository: event.repository,
          baseSha: pullRequest.base.sha,
          headSha: pullRequest.head.sha,
        },
        reviewUpdates,
        { fetchLike, githubHeaders }
      )
    : undefined;
  const coverageByUpdate = new Map(
    (npmCoverage?.items ?? []).map((item) => [
      `${item.update.name}\u0000${item.update.from}\u0000${item.update.to}`,
      item,
    ])
  );
  const normalizedUpdates = reviewUpdates.map((dependency) => {
    const coverage = coverageByUpdate.get(
      `${dependency.name}\u0000${dependency.from}\u0000${dependency.to}`
    );
    return coverage
      ? { ...dependency, dependencyType: coverage.update.dependencyType }
      : dependency;
  });
  const rateLimitedTargets = new Map();
  const packages = await Promise.all(
    normalizedUpdates.map(async (dependency) => {
      const update = updateIdentity(dependency);
      const coverage = coverageByUpdate.get(update);
      const isGroupBacked = groupBacked(coverage, dependency);
      const target =
        coverage?.group.kind === 'direct' ? updateIdentity(coverage.group.anchor) : update;
      let evidence;
      if (isGroupBacked) {
        evidence = {
          status: 'group_backed',
          availability: 'group_backed',
          reason:
            'Upstream evidence is collected for the direct update that supplies this group scope.',
          sources: [],
        };
      } else {
        const limit = githubRequestDiagnostic()?.limit;
        if (limit) {
          rateLimitedTargets.set(target, limit);
          evidence = {
            status: 'unavailable',
            availability: 'collection_failed',
            reason: githubLimitReason(limit),
            sources: [],
          };
        } else {
          const metadata =
            dependency.ecosystem === 'actions'
              ? null
              : await fetchJson(
                  fetchLike,
                  `https://registry.npmjs.org/${encodeURIComponent(dependency.name)}`
                );
          const repository = dependency.repository ?? githubRepository(metadata?.repository?.url);
          evidence = await collectUpstreamEvidence({
            repository,
            dependency,
            metadata,
            fetchLike,
            githubHeaders,
          });
          const observedLimit = githubRequestDiagnostic()?.limit;
          if (observedLimit) {
            rateLimitedTargets.set(target, observedLimit);
            evidence = {
              status: 'unavailable',
              availability: 'collection_failed',
              reason: githubLimitReason(observedLimit),
              sources: [],
            };
          }
        }
      }
      const [source] = evidence.sources;
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
          severity: isVulnerabilitySeverity(vulnerability.severity) ? vulnerability.severity : null,
          range: { from: dependency.from, to: dependency.to },
        }));
      for (const vulnerability of vulnerabilitySources)
        findings.push({
          id: `${dependency.name}:vulnerability:${vulnerability.url}`,
          kind: 'vulnerability',
          reason: `GitHub dependency review reported a vulnerability in ${dependency.name}.`,
          sourceUrl: vulnerability.url,
          severity: vulnerability.severity,
          remediation: [`Review and remediate ${vulnerability.title}.`],
          validation: ['npm run check', 'npm test'],
        });
      return {
        ecosystem: dependency.ecosystem,
        name: dependency.name,
        from: dependency.from,
        to: dependency.to,
        dependencyType: dependency.dependencyType,
        license: dependency.license ?? null,
        evidence: {
          status: evidence.status,
          reason: evidence.reason,
          ...(evidence.availability === undefined ? {} : { availability: evidence.availability }),
        },
        sources: [...vulnerabilitySources, ...evidence.sources],
        findings,
      };
    })
  );
  if (!packages.length) return null;
  const contexts = await collectRepositoryContext(
    packages,
    repositoryContext ?? { paths: [], readFile: async () => '' }
  );
  const contextByName = new Map(contexts.map((context) => [context.name, context]));
  const packagesWithContext = packages.map((dependency) => {
    const context = contextByName.get(dependency.name) ?? {
      status: 'unavailable',
      facts: [],
    };
    return {
      ...dependency,
      context: { status: context.status, facts: context.facts },
    };
  });
  const coverage = limitedCoverage(
    collectCoverage
      ? {
          items: packagesWithContext.map(
            (dependency) =>
              coverageByUpdate.get(
                `${dependency.name}\u0000${dependency.from}\u0000${dependency.to}`
              ) ?? {
                update: {
                  name: dependency.name,
                  from: dependency.from,
                  to: dependency.to,
                  dependencyType: dependency.dependencyType,
                },
                group: { kind: 'standalone', anchor: null },
                lifecycle: {
                  status: 'unchanged',
                  metadata: 'not_needed',
                  paths: [],
                  changes: [],
                  reason: null,
                },
                status: 'complete',
                reason: null,
              }
          ),
        }
      : undefined,
    rateLimitedTargets
  );
  return parseReviewInput({
    pullRequest: {
      number: pullRequest.number,
      baseSha: pullRequest.base.sha,
      headSha: pullRequest.head.sha,
    },
    packages: packagesWithContext,
    ...(coverage ? { coverage } : {}),
  });
}
