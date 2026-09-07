import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const npmRegistry = 'https://registry.npmjs.org/';

class UnsupportedSourceError extends Error {}

const unavailable = (reason) => ({
  status: 'unavailable',
  invalid: 0,
  missing: 0,
  reason,
});
const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);
const dependencyMaps = (packageValue) => [
  packageValue.dependencies,
  packageValue.devDependencies,
  packageValue.optionalDependencies,
  packageValue.peerDependencies,
];

function isGitHubShorthand(reference) {
  const [path] = reference.split('#', 1);
  const segments = path.split('/');
  return (
    segments.length === 2 &&
    segments.every((segment) => segment && !/\s/.test(segment)) &&
    !segments[0].startsWith('@')
  );
}

function isUnsupportedReference(value) {
  const reference = value.trim().toLowerCase();
  if (reference.startsWith('npm:')) {
    const aliasTarget = reference.slice(4);
    const versionSeparator = aliasTarget.lastIndexOf('@');
    return isUnsupportedReference(
      versionSeparator > 0 ? aliasTarget.slice(versionSeparator + 1) : aliasTarget
    );
  }
  return (
    /^(?:file:|link:|workspace:|git\+|git:|github:|gitlab:|bitbucket:|https?:|ssh:|git@|\.{1,2}(?:\/|$)|\/|~\/)/.test(
      reference
    ) ||
    reference.includes('://') ||
    isGitHubShorthand(reference)
  );
}

function assertSafeDependencyReferences(packageValue) {
  for (const dependencies of dependencyMaps(packageValue)) {
    if (dependencies === undefined) continue;
    if (!isObject(dependencies)) throw new TypeError('dependency maps must be objects');
    for (const [name, reference] of Object.entries(dependencies)) {
      if (
        !name ||
        ['__proto__', 'constructor', 'prototype'].includes(name) ||
        typeof reference !== 'string'
      )
        throw new TypeError('dependency references must be non-empty strings');
      if (isUnsupportedReference(reference)) throw new UnsupportedSourceError();
    }
  }
}

function validateOverrides(overrides) {
  if (overrides === undefined) return undefined;
  if (!isObject(overrides)) throw new TypeError('overrides must be an object');
  for (const [name, override] of Object.entries(overrides)) {
    if (!name || ['__proto__', 'constructor', 'prototype'].includes(name))
      throw new TypeError('override names must be safe package names');
    if (typeof override === 'string') {
      if (isUnsupportedReference(override)) throw new UnsupportedSourceError();
      continue;
    }
    validateOverrides(override);
  }
  return overrides;
}

function isPublicNpmUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'registry.npmjs.org';
  } catch {
    return false;
  }
}

function parseLockfile(value, overrides) {
  if (typeof value !== 'string') throw new TypeError('lockfile must be JSON text');
  const lockfile = JSON.parse(value);
  if (lockfile.lockfileVersion !== 3 || !isObject(lockfile.packages))
    throw new TypeError('lockfile must use npm lockfile version 3');
  const rootPackage = lockfile.packages[''];
  if (!isObject(rootPackage)) throw new TypeError('lockfile must include a root package');
  const safeOverrides = validateOverrides(overrides);

  for (const packageValue of Object.values(lockfile.packages)) {
    if (!isObject(packageValue)) throw new TypeError('lockfile packages must be objects');
    assertSafeDependencyReferences(packageValue);
    if (packageValue.link === true) throw new UnsupportedSourceError();
    if (packageValue.resolved === undefined) continue;
    if (typeof packageValue.resolved !== 'string' || !isPublicNpmUrl(packageValue.resolved))
      throw new UnsupportedSourceError();
    if (typeof packageValue.version === 'string' && isUnsupportedReference(packageValue.version))
      throw new UnsupportedSourceError();
  }

  const manifest = {
    name: 'dependabot-provenance-verifier',
    version: '0.0.0',
    private: true,
    ...(rootPackage.dependencies === undefined ? {} : { dependencies: rootPackage.dependencies }),
    ...(rootPackage.devDependencies === undefined
      ? {}
      : { devDependencies: rootPackage.devDependencies }),
    ...(rootPackage.optionalDependencies === undefined
      ? {}
      : { optionalDependencies: rootPackage.optionalDependencies }),
    ...(rootPackage.peerDependencies === undefined
      ? {}
      : { peerDependencies: rootPackage.peerDependencies }),
    ...(safeOverrides === undefined ? {} : { overrides: safeOverrides }),
  };
  return { lockfile: value, manifest };
}

function parseAuditOutput(value) {
  if (typeof value !== 'string') return null;
  try {
    const result = JSON.parse(value);
    if (!Array.isArray(result?.invalid) || !Array.isArray(result?.missing)) return null;
    const invalid = result.invalid.length;
    const missing = result.missing.length;
    return invalid || missing
      ? {
          status: 'attention_required',
          invalid,
          missing,
          reason: 'npm reported missing or invalid package provenance.',
        }
      : { status: 'verified', invalid, missing, reason: null };
  } catch {
    return null;
  }
}

const isTimeout = (error) => error?.code === 'ETIMEDOUT' || error?.killed === true;
const errorOutput = (error) => (typeof error?.stdout === 'string' ? error.stdout : null);
const defaultRunCommand = async (command, args, options) => {
  const result = await execFileAsync(command, args, {
    encoding: 'utf8',
    ...options,
  });
  return { stdout: String(result.stdout), stderr: String(result.stderr) };
};

export async function collectProvenance(options) {
  const { lockfile, overrides, runCommand = defaultRunCommand, timeoutMs = 30_000 } = options;
  let input;
  try {
    input = parseLockfile(lockfile, overrides);
  } catch (error) {
    return error instanceof UnsupportedSourceError
      ? unavailable('The lockfile includes a source outside the public npm registry.')
      : unavailable('The lockfile could not be safely verified.');
  }

  let directory;
  try {
    directory = await mkdtemp(join(tmpdir(), 'dependabot-provenance-'));
  } catch {
    return unavailable('The npm verifier workspace could not be created.');
  }

  let result;
  try {
    const cache = join(directory, 'npm-cache');
    const environment = {
      PATH: process.env.PATH ?? '',
      HOME: process.env.HOME ?? directory,
      NPM_CONFIG_CACHE: cache,
      NPM_CONFIG_REGISTRY: npmRegistry,
      NPM_CONFIG_USERCONFIG: join(directory, 'npmrc'),
    };
    const deadline = Date.now() + timeoutMs;
    const commandOptions = () => {
      const timeout = deadline - Date.now();
      if (timeout <= 0) {
        const error = Object.assign(new Error('timed out'), {
          code: 'ETIMEDOUT',
        });
        throw error;
      }
      return { cwd: directory, env: environment, timeout };
    };
    // oxlint-disable-next-line security/detect-non-literal-fs-filename -- The path is under the directory created by mkdtemp above.
    await writeFile(join(directory, 'package-lock.json'), input.lockfile);
    // oxlint-disable-next-line security/detect-non-literal-fs-filename -- The path is under the directory created by mkdtemp above.
    await writeFile(join(directory, 'package.json'), `${JSON.stringify(input.manifest)}\n`);
    await runCommand(
      'npm',
      [
        'ci',
        '--ignore-scripts',
        '--no-bin-links',
        '--no-audit',
        '--no-fund',
        '--workspaces=false',
        `--registry=${npmRegistry}`,
      ],
      commandOptions()
    );
    try {
      const audit = await runCommand(
        'npm',
        [
          'audit',
          'signatures',
          '--json',
          '--package-lock-only',
          '--ignore-scripts',
          `--registry=${npmRegistry}`,
        ],
        commandOptions()
      );
      result = parseAuditOutput(audit?.stdout);
    } catch (error) {
      result = parseAuditOutput(errorOutput(error));
      if (!result)
        result = isTimeout(error)
          ? unavailable('The npm verifier timed out.')
          : unavailable('The npm verifier did not return usable evidence.');
    }
    if (!result) result = unavailable('The npm verifier did not return usable evidence.');
  } catch (error) {
    result = isTimeout(error)
      ? unavailable('The npm verifier timed out.')
      : unavailable('The npm verifier did not return usable evidence.');
  }

  try {
    await rm(directory, { force: true, recursive: true, maxRetries: 3 });
  } catch {
    return unavailable('The npm verifier workspace could not be cleaned up.');
  }
  return result;
}
