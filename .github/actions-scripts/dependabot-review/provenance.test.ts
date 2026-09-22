/// <reference types="node" />

import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vite-plus/test';
import { collectProvenance } from './provenance.mjs';

type CommandOptions = {
  cwd: string;
  env: NodeJS.ProcessEnv;
  timeout: number;
};

const publicLockfile = JSON.stringify({
  lockfileVersion: 3,
  packages: {
    '': {
      dependencies: { example: '^1.0.0' },
      devDependencies: { 'example-dev': '^2.0.0' },
      scripts: { postinstall: 'untrusted command' },
      workspaces: ['packages/*'],
    },
    'node_modules/example': {
      version: '1.0.0',
      resolved: 'https://registry.npmjs.org/example/-/example-1.0.0.tgz',
    },
    'node_modules/example-dev': { version: '2.0.0' },
  },
});
const approvedOverrides = {
  vite: 'npm:@voidzero-dev/vite-plus-core@0.2.8',
  sharp: '0.35.3',
};

describe('npm provenance collector', () => {
  it('uses a script-free, public-registry-only temporary tree and removes it after verification', async () => {
    let temporaryDirectory = '';
    vi.stubEnv('GITHUB_TOKEN', 'must-not-reach-npm');
    vi.stubEnv('MISTRAL_API_KEY', 'must-not-reach-npm');
    const runCommand = vi.fn(async (command: string, args: string[], options: CommandOptions) => {
      temporaryDirectory = options.cwd;
      if (args[0] === 'ci') {
        expect(command).toBe('npm');
        expect(args).toEqual([
          'ci',
          '--ignore-scripts',
          '--no-bin-links',
          '--no-audit',
          '--no-fund',
          '--workspaces=false',
          '--registry=https://registry.npmjs.org/',
        ]);
        expect(options.env.NPM_CONFIG_CACHE).toBe(join(options.cwd, 'npm-cache'));
        expect(options.env.NPM_CONFIG_REGISTRY).toBe('https://registry.npmjs.org/');
        expect(options.env.GITHUB_TOKEN).toBeUndefined();
        expect(options.env.MISTRAL_API_KEY).toBeUndefined();
        expect(options.timeout).toBeGreaterThan(0);
        expect(JSON.parse(await readFile(join(options.cwd, 'package.json'), 'utf8'))).toEqual({
          name: 'dependabot-provenance-verifier',
          version: '0.0.0',
          private: true,
          dependencies: { example: '^1.0.0' },
          devDependencies: { 'example-dev': '^2.0.0' },
          overrides: approvedOverrides,
        });
        return { stdout: '', stderr: '' };
      }
      expect(args).toEqual([
        'audit',
        'signatures',
        '--json',
        '--package-lock-only',
        '--ignore-scripts',
        '--registry=https://registry.npmjs.org/',
      ]);
      return { stdout: JSON.stringify({ invalid: [], missing: [] }), stderr: '' };
    });

    try {
      await expect(
        collectProvenance({ lockfile: publicLockfile, overrides: approvedOverrides, runCommand })
      ).resolves.toEqual({ status: 'verified', invalid: 0, missing: 0, reason: null });
      expect(runCommand).toHaveBeenCalledTimes(2);
      await expect(access(temporaryDirectory)).rejects.toThrow();
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('returns bounded attention evidence when npm reports invalid or missing packages', async () => {
    const runCommand = vi
      .fn()
      .mockResolvedValueOnce({ stdout: '', stderr: '' })
      .mockResolvedValueOnce({
        stdout: JSON.stringify({ invalid: [{ name: 'bad' }], missing: [{ name: 'missing' }] }),
        stderr: '',
      });

    await expect(
      collectProvenance({ lockfile: publicLockfile, overrides: approvedOverrides, runCommand })
    ).resolves.toEqual({
      status: 'attention_required',
      invalid: 1,
      missing: 1,
      reason: 'npm reported missing or invalid package provenance.',
    });
  });

  it.each([
    ['private registry', 'https://npm.example.com/example/-/example-1.0.0.tgz'],
    ['git source', 'git+https://github.com/example/example.git'],
    ['local source', 'file:../example.tgz'],
  ])('returns unavailable without calling npm for a %s', async (_, source) => {
    const lockfile = JSON.stringify({
      lockfileVersion: 3,
      packages: { '': {}, 'node_modules/example': { version: '1.0.0', resolved: source } },
    });
    const runCommand = vi.fn();

    await expect(collectProvenance({ lockfile, runCommand })).resolves.toEqual({
      status: 'unavailable',
      invalid: 0,
      missing: 0,
      reason: 'The lockfile includes a source outside the public npm registry.',
    });
    expect(runCommand).not.toHaveBeenCalled();
  });

  it('returns unavailable and removes the workspace when npm fails without usable JSON', async () => {
    let temporaryDirectory = '';
    const runCommand = vi.fn(async (_command: string, _args: string[], options: CommandOptions) => {
      temporaryDirectory = options.cwd;
      throw new Error('network response included untrusted details');
    });

    await expect(collectProvenance({ lockfile: publicLockfile, runCommand })).resolves.toEqual({
      status: 'unavailable',
      invalid: 0,
      missing: 0,
      reason: 'The npm verifier did not return usable evidence.',
    });
    await expect(access(temporaryDirectory)).rejects.toThrow();
  });

  it('returns unavailable and removes the workspace when npm times out', async () => {
    let temporaryDirectory = '';
    const runCommand = vi.fn(async (_command: string, _args: string[], options: CommandOptions) => {
      temporaryDirectory = options.cwd;
      const error = Object.assign(new Error('timed out'), { code: 'ETIMEDOUT' });
      throw error;
    });

    await expect(collectProvenance({ lockfile: publicLockfile, runCommand })).resolves.toEqual({
      status: 'unavailable',
      invalid: 0,
      missing: 0,
      reason: 'The npm verifier timed out.',
    });
    await expect(access(temporaryDirectory)).rejects.toThrow();
  });

  it.each([
    'file:../example.tgz',
    'git+https://github.com/example/example.git',
    'npm:example@file:../example.tgz',
    'npm:git+https://github.com/example/example.git',
    'example/example',
  ])('returns unavailable without calling npm for an unsafe override', async (override) => {
    const runCommand = vi.fn();

    await expect(
      collectProvenance({
        lockfile: publicLockfile,
        overrides: { example: override },
        runCommand,
      })
    ).resolves.toEqual({
      status: 'unavailable',
      invalid: 0,
      missing: 0,
      reason: 'The lockfile includes a source outside the public npm registry.',
    });
    expect(runCommand).not.toHaveBeenCalled();
  });
});
