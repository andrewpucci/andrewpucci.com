/// <reference types="node" />

import { describe, expect, it } from 'vite-plus/test';
import { collectNpmCoverage } from './coverage.mjs';

const update = (name: string, from: string, to: string, dependencyType = 'transitive') => ({
  ecosystem: 'npm',
  name,
  from,
  to,
  dependencyType,
});

function lockfile(packages: Record<string, unknown>) {
  return { lockfileVersion: 3, packages };
}

describe('collectNpmCoverage', () => {
  it('classifies every manifest role and keeps conflicting declarations unknown', () => {
    const result = collectNpmCoverage({
      updates: [
        update('production', '1.0.0', '2.0.0'),
        update('development', '1.0.0', '2.0.0'),
        update('peer', '1.0.0', '2.0.0'),
        update('optional', '1.0.0', '2.0.0'),
        update('conflicting', '1.0.0', '2.0.0'),
      ],
      headManifest: {
        dependencies: { production: '^2.0.0', conflicting: '^2.0.0' },
        devDependencies: { development: '^2.0.0', conflicting: '^2.0.0' },
        peerDependencies: { peer: '^2.0.0' },
        optionalDependencies: { optional: '^2.0.0' },
      },
    });

    expect(result.items.map((item) => item.update.dependencyType)).toEqual([
      'direct:production',
      'direct:development',
      'direct:peer',
      'direct:optional',
      'direct:unknown',
    ]);
  });

  it('groups an unambiguous transitive update with its direct production anchor', () => {
    const result = collectNpmCoverage({
      updates: [
        update('direct', '1.0.0', '2.0.0', 'direct:unknown'),
        update('nested', '1.0.0', '2.0.0'),
      ],
      baseManifest: { dependencies: { direct: '^1.0.0' } },
      headManifest: { dependencies: { direct: '^2.0.0' } },
      baseLockfile: lockfile({
        '': { dependencies: { direct: '^1.0.0' } },
        'node_modules/direct': { version: '1.0.0', dependencies: { nested: '^1.0.0' } },
        'node_modules/nested': { version: '1.0.0', hasInstallScript: false },
      }),
      headLockfile: lockfile({
        '': { dependencies: { direct: '^2.0.0' } },
        'node_modules/direct': { version: '2.0.0', dependencies: { nested: '^2.0.0' } },
        'node_modules/nested': { version: '2.0.0', hasInstallScript: false },
      }),
    });

    expect(result.items).toMatchObject([
      {
        update: { name: 'direct', dependencyType: 'direct:production' },
        group: { kind: 'direct', anchor: { name: 'direct', from: '1.0.0', to: '2.0.0' } },
        lifecycle: { status: 'unchanged' },
        status: 'complete',
      },
      {
        update: { name: 'nested', dependencyType: 'transitive' },
        group: { kind: 'direct', anchor: { name: 'direct', from: '1.0.0', to: '2.0.0' } },
        lifecycle: { status: 'unchanged' },
        status: 'complete',
      },
    ]);
  });

  it('uses an explicit optional dependency edge without inferring a package relationship', () => {
    const result = collectNpmCoverage({
      updates: [
        update('direct', '1.0.0', '2.0.0', 'direct:unknown'),
        update('platform-binary', '1.0.0', '2.0.0'),
      ],
      baseManifest: { dependencies: { direct: '^1.0.0' } },
      headManifest: { dependencies: { direct: '^2.0.0' } },
      baseLockfile: lockfile({
        '': { dependencies: { direct: '^1.0.0' } },
        'node_modules/direct': {
          version: '1.0.0',
          optionalDependencies: { 'platform-binary': '^1.0.0' },
        },
        'node_modules/platform-binary': { version: '1.0.0' },
      }),
      headLockfile: lockfile({
        '': { dependencies: { direct: '^2.0.0' } },
        'node_modules/direct': {
          version: '2.0.0',
          optionalDependencies: { 'platform-binary': '^2.0.0' },
        },
        'node_modules/platform-binary': { version: '2.0.0' },
      }),
    });

    expect(result.items[1]).toMatchObject({
      group: { kind: 'direct', anchor: { name: 'direct', from: '1.0.0', to: '2.0.0' } },
      status: 'complete',
    });
  });

  it('leaves duplicate package paths unresolved when they do not share one direct anchor', () => {
    const result = collectNpmCoverage({
      updates: [
        update('direct', '1.0.0', '2.0.0', 'direct:unknown'),
        update('nested', '1.0.0', '2.0.0'),
      ],
      baseManifest: { dependencies: { direct: '^1.0.0', other: '^1.0.0' } },
      headManifest: { dependencies: { direct: '^2.0.0', other: '^1.0.0' } },
      baseLockfile: lockfile({
        '': { dependencies: { direct: '^1.0.0', other: '^1.0.0' } },
        'node_modules/direct': { version: '1.0.0', dependencies: { nested: '^1.0.0' } },
        'node_modules/other': { version: '1.0.0', dependencies: { nested: '^1.0.0' } },
        'node_modules/direct/node_modules/nested': { version: '1.0.0' },
        'node_modules/other/node_modules/nested': { version: '1.0.0' },
      }),
      headLockfile: lockfile({
        '': { dependencies: { direct: '^2.0.0', other: '^1.0.0' } },
        'node_modules/direct': { version: '2.0.0', dependencies: { nested: '^2.0.0' } },
        'node_modules/other': { version: '1.0.0', dependencies: { nested: '^2.0.0' } },
        'node_modules/direct/node_modules/nested': { version: '2.0.0' },
        'node_modules/other/node_modules/nested': { version: '2.0.0' },
      }),
    });

    expect(result.items[1]).toMatchObject({
      update: { name: 'nested' },
      group: { kind: 'standalone', anchor: null },
      status: 'unresolved',
      reason: 'ambiguous_relationship',
    });
  });
});
