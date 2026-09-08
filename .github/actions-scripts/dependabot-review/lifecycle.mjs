const lifecycleScripts = ['preinstall', 'install', 'postinstall'];
const registryOrigin = 'https://registry.npmjs.org';
const maxMetadataChars = 128_000;
const maxScriptChars = 1_000;
const registryTimeoutMs = 30_000;
const maxLifecycleMetadataUpdates = 12;

const isObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const identity = ({ name, from, to }) => `${name}\u0000${from}\u0000${to}`;

function registryUrl(name, version) {
  return `${registryOrigin}/${encodeURIComponent(name)}/${encodeURIComponent(version)}`;
}

async function fetchPackageMetadata(name, version, fetchLike) {
  try {
    const response = await fetchLike(registryUrl(name, version), {
      headers: { Accept: 'application/json' },
      redirect: 'error',
      signal: AbortSignal.timeout(registryTimeoutMs),
    });
    const declaredLength = Number(response.headers.get('content-length'));
    if (!response.ok || (Number.isFinite(declaredLength) && declaredLength > maxMetadataChars))
      return null;
    if (response.url && new URL(response.url).origin !== registryOrigin) return null;
    // The header is advisory; enforce the same byte cap while consuming the stream.
    const text = await boundedResponseText(response);
    if (text === null) return null;
    const metadata = JSON.parse(text);
    return metadata?.name === name && metadata?.version === version ? metadata : null;
  } catch {
    return null;
  }
}

async function boundedResponseText(response) {
  const reader = response.body?.getReader();
  if (!reader) return null;
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxMetadataChars) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const text = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    text.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(text);
}

function lifecycleScriptValue(scripts, name) {
  if (name === 'preinstall') return scripts.preinstall;
  if (name === 'install') return scripts.install;
  return scripts.postinstall;
}

function scriptValues(metadata) {
  if (!isObject(metadata.scripts)) return {};
  const result = new Map();
  for (const name of lifecycleScripts) {
    const value = lifecycleScriptValue(metadata.scripts, name);
    if (value === undefined) continue;
    if (typeof value !== 'string' || value.length > maxScriptChars) return null;
    result.set(name, value);
  }
  return result;
}

function scriptChanges(before, after) {
  return lifecycleScripts.flatMap((name) => {
    const previous = before.get(name);
    const next = after.get(name);
    if (previous === next) return [];
    if (previous === undefined) return [{ name, kind: 'added', after: next }];
    if (next === undefined) return [{ name, kind: 'removed', before: previous }];
    return [{ name, kind: 'changed', before: previous, after: next }];
  });
}

async function mapWithConcurrency(values, limit, action) {
  const results = [];
  let next = 0;
  async function worker() {
    while (next < values.length) {
      const index = next;
      next += 1;
      const value = values.at(index);
      if (value !== undefined) results.push(await action(value));
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, worker));
  return results;
}

function lifecycleUnavailable(item, metadataReason = 'metadata_unavailable') {
  return {
    ...item,
    lifecycle: {
      ...item.lifecycle,
      metadata: 'unavailable',
      changes: [],
      reason: metadataReason,
    },
    status: 'unresolved',
    reason: `lifecycle_${metadataReason}`,
  };
}

/**
 * Resolves pending lifecycle evidence through exact, redirect-free npm metadata requests.
 * The bounded request pool prevents a large Dependabot update from multiplying registry traffic.
 */
export async function collectLifecycleScripts(coverage, { fetchLike = fetch } = {}) {
  const pending = coverage.items.filter((item) => item.lifecycle.metadata === 'pending');
  const requested = pending.slice(0, maxLifecycleMetadataUpdates);
  const metadata = await mapWithConcurrency(requested, 2, async (item) => {
    const before = await fetchPackageMetadata(item.update.name, item.update.from, fetchLike);
    const after = await fetchPackageMetadata(item.update.name, item.update.to, fetchLike);
    return { item, pair: [before, after] };
  });
  const resolved = new Map(metadata.map(({ item, pair }) => [identity(item.update), pair]));
  return {
    ...coverage,
    items: coverage.items.map((item) => {
      const pair = resolved.get(identity(item.update));
      if (!pair)
        return item.lifecycle.metadata === 'pending'
          ? lifecycleUnavailable(item, 'metadata_budget_exhausted')
          : item;
      const [beforeMetadata, afterMetadata] = pair;
      const before = beforeMetadata && scriptValues(beforeMetadata);
      const after = afterMetadata && scriptValues(afterMetadata);
      const changes = before && after ? scriptChanges(before, after) : [];
      if (!before || !after || !changes.length) return lifecycleUnavailable(item);
      return {
        ...item,
        lifecycle: { ...item.lifecycle, metadata: 'available', changes },
        status: 'complete',
        reason: null,
      };
    }),
  };
}
