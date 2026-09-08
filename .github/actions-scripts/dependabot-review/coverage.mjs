const isObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const identity = ({ name, from, to }) => `${name}\u0000${from}\u0000${to}`;
const anchorIdentity = ({ name, from, to }) => ({ name, from, to });

function directRoles(manifest) {
  if (!isObject(manifest)) return null;
  const roles = new Map();
  const sections = [
    [manifest.dependencies, 'production'],
    [manifest.devDependencies, 'development'],
    [manifest.peerDependencies, 'peer'],
    [manifest.optionalDependencies, 'optional'],
  ];
  for (const [dependencies, role] of sections) {
    if (dependencies === undefined) continue;
    if (!isObject(dependencies)) return null;
    for (const name of Object.keys(dependencies)) {
      const current = roles.get(name) ?? new Set();
      current.add(role);
      roles.set(name, current);
    }
  }
  return new Map(
    [...roles].map(([name, values]) => [
      name,
      `direct:${values.size === 1 ? [...values][0] : 'unknown'}`,
    ])
  );
}

function packageNameAtPath(path) {
  if (path === '') return null;
  const parts = path.split('/');
  const nodeModules = parts.lastIndexOf('node_modules');
  const packageParts = parts.slice(nodeModules + 1);
  if (nodeModules < 0 || !packageParts.length) return null;
  if (packageParts[0].startsWith('@'))
    return packageParts.length === 2 ? packageParts.join('/') : null;
  return packageParts.length === 1 ? packageParts[0] : null;
}

function parentPackagePath(path) {
  if (path === '') return null;
  const parts = path.split('/');
  const nodeModules = parts.lastIndexOf('node_modules');
  return nodeModules < 0 ? null : parts.slice(0, nodeModules).join('/');
}

function parseLockfile(lockfile) {
  if (!isObject(lockfile) || lockfile.lockfileVersion !== 3 || !isObject(lockfile.packages))
    return null;
  const packages = new Map();
  for (const [path, entry] of Object.entries(lockfile.packages)) {
    if (
      !isObject(entry) ||
      (entry.dependencies !== undefined && !isObject(entry.dependencies)) ||
      (entry.optionalDependencies !== undefined && !isObject(entry.optionalDependencies))
    )
      return null;
    if (path !== '' && !packageNameAtPath(path)) return null;
    packages.set(path, entry);
  }
  return packages.has('') ? packages : null;
}

function packagePaths(packages, name, version) {
  return [...packages]
    .filter(
      ([path, entry]) =>
        packageNameAtPath(path) === name &&
        typeof entry.version === 'string' &&
        entry.version === version
    )
    .map(([path]) => path);
}

function resolvedDependencyPath(packages, ownerPath, name) {
  let parent = ownerPath;
  while (parent !== null) {
    const candidate = `${parent ? `${parent}/` : ''}node_modules/${name}`;
    if (packages.has(candidate)) return candidate;
    parent = parentPackagePath(parent);
  }
  return null;
}

function packageGraph(packages) {
  const graph = new Map();
  for (const [path, entry] of packages) {
    const edges = new Set();
    for (const name of new Set([
      ...Object.keys(entry.dependencies ?? {}),
      ...Object.keys(entry.optionalDependencies ?? {}),
    ])) {
      const target = resolvedDependencyPath(packages, path, name);
      if (target) edges.add(target);
    }
    graph.set(path, edges);
  }
  return graph;
}

function reachablePaths(graph, start) {
  const seen = new Set([start]);
  const pending = [start];
  while (pending.length) {
    const path = pending.pop();
    for (const target of graph.get(path) ?? []) {
      if (seen.has(target)) continue;
      seen.add(target);
      pending.push(target);
    }
  }
  return seen;
}

function lifecycleDelta(update, basePackages, headPackages) {
  const basePaths = packagePaths(basePackages, update.name, update.from).sort();
  const headPaths = packagePaths(headPackages, update.name, update.to).sort();
  if (
    !basePaths.length ||
    basePaths.length !== headPaths.length ||
    !basePaths.every((path) => headPaths.includes(path))
  )
    return {
      status: 'unavailable',
      metadata: 'unavailable',
      changes: [],
      paths: headPaths,
      reason: 'unmatched_lockfile_paths',
    };
  const changedPaths = headPaths.filter(
    (path) =>
      Boolean(basePackages.get(path)?.hasInstallScript) !==
      Boolean(headPackages.get(path)?.hasInstallScript)
  );
  return changedPaths.length
    ? {
        status: 'changed',
        metadata: 'pending',
        changes: [],
        paths: changedPaths,
        reason: null,
      }
    : { status: 'unchanged', metadata: 'not_needed', changes: [], paths: headPaths, reason: null };
}

function unavailableItem(update, reason) {
  return {
    update,
    group: { kind: 'standalone', anchor: null },
    lifecycle: {
      status: 'unavailable',
      metadata: 'unavailable',
      changes: [],
      paths: [],
      reason,
    },
    status: 'unresolved',
    reason,
  };
}

/**
 * Converts immutable npm manifests and lockfiles into conservative per-update coverage evidence.
 * An update is grouped only if every matching installed path has the same changed direct anchor.
 *
 * @param {{
 *   updates?: Array<{ ecosystem: string, name: string, from: string, to: string, dependencyType: string }>,
 *   baseManifest?: unknown,
 *   headManifest?: unknown,
 *   baseLockfile?: unknown,
 *   headLockfile?: unknown,
 * }} [input]
 */
export function collectNpmCoverage(input = {}) {
  const { updates = [], baseManifest, headManifest, baseLockfile, headLockfile } = input;
  const baseRoles = directRoles(baseManifest);
  const roles = directRoles(headManifest);
  const basePackages = parseLockfile(baseLockfile);
  const headPackages = parseLockfile(headLockfile);
  const npmUpdates = updates
    .filter((update) => update.ecosystem === 'npm')
    .map((update) => ({
      ...update,
      dependencyType: roles?.get(update.name) ?? update.dependencyType,
    }));
  if (!baseRoles || !roles || !basePackages || !headPackages)
    return {
      items: npmUpdates.map((update) => unavailableItem(update, 'coverage_inputs_unavailable')),
    };

  const graph = packageGraph(headPackages);
  const anchors = npmUpdates
    .filter((update) => update.dependencyType.startsWith('direct:'))
    .flatMap((update) => {
      const path = resolvedDependencyPath(headPackages, '', update.name);
      return path && headPackages.get(path)?.version === update.to
        ? [{ update, path, reachable: reachablePaths(graph, path) }]
        : [];
    });

  return {
    items: npmUpdates.map((update) => {
      const paths = packagePaths(headPackages, update.name, update.to);
      const matchingAnchors = paths.map((path) =>
        anchors.filter((anchor) => anchor.reachable.has(path))
      );
      const possibleAnchors = new Set(
        matchingAnchors.flat().map((anchor) => identity(anchor.update))
      );
      const directAnchor = anchors.find((anchor) => identity(anchor.update) === identity(update));
      const anchor =
        directAnchor ?? (possibleAnchors.size === 1 ? matchingAnchors.flat()[0] : undefined);
      const hasUnambiguousAnchor =
        Boolean(paths.length) &&
        Boolean(anchor) &&
        matchingAnchors.every(
          (candidates) =>
            candidates.length === 1 && identity(candidates[0].update) === identity(anchor.update)
        );
      if (!hasUnambiguousAnchor) {
        const reason = paths.length ? 'ambiguous_relationship' : 'missing_lockfile_path';
        return {
          ...unavailableItem(update, reason),
          lifecycle: lifecycleDelta(update, basePackages, headPackages),
        };
      }
      const lifecycle = lifecycleDelta(update, basePackages, headPackages);
      const status =
        lifecycle.status === 'unavailable'
          ? 'unresolved'
          : lifecycle.metadata === 'pending'
            ? 'pending'
            : 'complete';
      return {
        update,
        group: { kind: 'direct', anchor: anchorIdentity(anchor.update) },
        lifecycle,
        status,
        reason:
          lifecycle.status === 'unavailable'
            ? lifecycle.reason
            : lifecycle.metadata === 'pending'
              ? 'lifecycle_metadata_pending'
              : null,
      };
    }),
  };
}
