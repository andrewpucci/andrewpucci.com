/// <reference types="node" />

import { describe, expect, it, vi } from 'vite-plus/test';
import { collectPullRequestProvenance, collectReviewInput } from './inputs.mjs';

const pullRequest = {
  number: 42,
  base: { sha: 'base' },
  head: { sha: 'head' },
  user: { login: 'dependabot[bot]' },
};

const packageFile = {
  filename: 'package.json',
  patch: '-    "example": "^1.0.0",\n+    +    "example": "^2.0.0",',
};

const dependencyDiff = [
  {
    change_type: 'removed',
    manifest: 'package.json',
    ecosystem: 'npm',
    name: 'example',
    version: '1.0.0',
    source_repository_url: 'https://github.com/example/package',
    license: 'MIT',
    vulnerabilities: [],
  },
  {
    change_type: 'added',
    manifest: 'package.json',
    ecosystem: 'npm',
    name: 'example',
    version: '2.0.0',
    source_repository_url: 'https://github.com/example/package',
    vulnerabilities: [],
  },
];

const lockfileDependencyDiff = dependencyDiff.map((change) => ({
  ...change,
  manifest: 'package-lock.json',
}));

const directPackageFile = {
  filename: 'package.json',
  patch: '-    "example": "^1.0.0",\n+    "example": "^2.0.0",',
};

const actionDependencyDiff = [
  {
    change_type: 'removed',
    manifest: '.github/workflows/review.yml',
    ecosystem: 'actions',
    name: 'actions/create-github-app-token',
    version: 'fee1f7d63c2ff003460e3d139729b119787bc349',
    source_repository_url: 'https://github.com/actions/create-github-app-token',
    license: null,
    vulnerabilities: [],
  },
  {
    change_type: 'added',
    manifest: '.github/workflows/review.yml',
    ecosystem: 'actions',
    name: 'actions/create-github-app-token',
    version: 'bcd2ba49218906704ab6c1aa796996da409d3eb1',
    source_repository_url: 'https://github.com/actions/create-github-app-token',
    license: null,
    vulnerabilities: [],
  },
];

const workflowFile = {
  filename: '.github/workflows/review.yml',
  patch:
    '-      uses: actions/create-github-app-token@fee1f7d63c2ff003460e3d139729b119787bc349\n+      uses: actions/create-github-app-token@bcd2ba49218906704ab6c1aa796996da409d3eb1',
};

function response(value: unknown) {
  return new Response(JSON.stringify(value));
}

function contentResponse(value: unknown) {
  return response({
    encoding: 'base64',
    content: Buffer.from(JSON.stringify(value)).toString('base64'),
  });
}

describe('collectPullRequestProvenance', () => {
  it('retrieves immutable provenance inputs and passes only overrides to the collector', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(contentResponse({ lockfileVersion: 3, packages: { '': {} } }))
      .mockResolvedValueOnce(
        contentResponse({ scripts: { postinstall: 'ignored' }, overrides: { example: '1.0.0' } })
      );
    const collectProvenance = vi.fn().mockResolvedValue({
      status: 'verified',
      invalid: 0,
      missing: 0,
      reason: null,
    });

    await expect(
      collectPullRequestProvenance(
        { repository: 'owner/repo', headSha: 'immutable-head' },
        {
          fetchLike: fetchMock,
          githubHeaders: { Authorization: 'Bearer read-token' },
          collectProvenance,
        }
      )
    ).resolves.toEqual({ status: 'verified', invalid: 0, missing: 0, reason: null });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://api.github.com/repos/owner/repo/contents/package-lock.json?ref=immutable-head',
      { headers: { Authorization: 'Bearer read-token' } }
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.github.com/repos/owner/repo/contents/package.json?ref=immutable-head',
      { headers: { Authorization: 'Bearer read-token' } }
    );
    expect(collectProvenance).toHaveBeenCalledWith({
      lockfile: JSON.stringify({ lockfileVersion: 3, packages: { '': {} } }),
      overrides: { example: '1.0.0' },
    });
  });

  it('returns unavailable without invoking npm when immutable inputs cannot be parsed', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(contentResponse({ lockfileVersion: 3, packages: { '': {} } }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ encoding: 'base64', content: 'not-json' }))
      );
    const collectProvenance = vi.fn();

    await expect(
      collectPullRequestProvenance(
        { repository: 'owner/repo', headSha: 'immutable-head' },
        { fetchLike: fetchMock, collectProvenance }
      )
    ).resolves.toEqual({
      status: 'unavailable',
      invalid: 0,
      missing: 0,
      reason: 'The pull request provenance inputs could not be safely parsed.',
    });
    expect(collectProvenance).not.toHaveBeenCalled();
  });
});

describe('collectReviewInput', () => {
  it('skips a Dependabot review when it cannot identify any packages', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response([]));

    await expect(
      collectReviewInput(
        {
          pull_request: pullRequest,
          repository: 'owner/repo',
          files: [],
        },
        { fetchLike: fetchMock }
      )
    ).resolves.toBeNull();
  });

  it('uses Dependabot versions and release notes for GitHub Actions updates', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(actionDependencyDiff))
      .mockResolvedValueOnce(
        response({
          html_url: 'https://github.com/actions/create-github-app-token/releases/tag/v3.2.0',
          name: 'v3.2.0',
          body: 'Adds enterprise-level GitHub App support.',
        })
      );

    const input = await collectReviewInput(
      {
        pull_request: {
          ...pullRequest,
          body: 'Updates `actions/create-github-app-token` from 2.2.2 to 3.2.0',
        },
        repository: 'owner/repo',
        files: [],
      },
      { fetchLike: fetchMock }
    );

    if (!input) throw new Error('Expected a Dependabot review packet.');
    expect(input.packages).toMatchObject([
      {
        name: 'actions/create-github-app-token',
        from: '2.2.2',
        to: '3.2.0',
        dependencyType: 'direct:workflow',
        evidence: { status: 'available', reason: null },
        sources: [
          {
            url: 'https://github.com/actions/create-github-app-token/releases/tag/v3.2.0',
            range: { from: '2.2.2', to: '3.2.0' },
          },
        ],
      },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toContain('/releases/tags/v3.2.0');
  });

  it('preserves direct package classification when the dependency graph records the lockfile', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(lockfileDependencyDiff))
      .mockResolvedValueOnce(
        response({
          html_url: 'https://github.com/example/package/releases/tag/v2.0.0',
          body: 'Example release notes.',
        })
      );

    const input = await collectReviewInput(
      {
        pull_request: pullRequest,
        repository: 'owner/repo',
        files: [directPackageFile],
      },
      { fetchLike: fetchMock }
    );

    expect(input?.packages).toMatchObject([{ name: 'example', dependencyType: 'direct:unknown' }]);
  });

  it('falls back to an unprefixed release tag when the v-prefixed tag is absent', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(actionDependencyDiff))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(
        response({
          html_url: 'https://github.com/actions/create-github-app-token/releases/tag/3.2.0',
          name: '3.2.0',
          body: 'Adds enterprise-level GitHub App support.',
        })
      );

    const input = await collectReviewInput(
      {
        pull_request: {
          ...pullRequest,
          body: 'Updates `actions/create-github-app-token` from 2.2.2 to 3.2.0',
        },
        repository: 'owner/repo',
        files: [],
      },
      { fetchLike: fetchMock }
    );

    expect(input?.packages[0].sources).toMatchObject([
      { url: 'https://github.com/actions/create-github-app-token/releases/tag/3.2.0' },
    ]);
    expect(fetchMock.mock.calls[2][0]).toContain('/releases/tags/3.2.0');
  });

  it('adds trusted workflow context to the review packet', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(actionDependencyDiff))
      .mockResolvedValueOnce(
        response({
          html_url: 'https://github.com/actions/create-github-app-token/releases/tag/v3.2.0',
          body: 'Adds enterprise-level GitHub App support.',
        })
      );

    const input = await collectReviewInput(
      {
        pull_request: {
          ...pullRequest,
          body: 'Updates `actions/create-github-app-token` from 2.2.2 to 3.2.0',
        },
        repository: 'owner/repo',
        files: [],
      },
      {
        fetchLike: fetchMock,
        repositoryContext: {
          paths: ['.github/workflows/review.yml'],
          readFile: async () => 'uses: actions/create-github-app-token@v3.2.0',
        },
      }
    );

    expect(input?.packages[0].context).toEqual({
      status: 'available',
      facts: [
        {
          kind: 'workflow-action',
          path: '.github/workflows/review.yml',
          excerpt: 'uses: actions/create-github-app-token@v3.2.0',
        },
      ],
    });
  });

  it('uses an upstream compare when neither target release tag exists', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(actionDependencyDiff))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(
        response({
          html_url: 'https://github.com/actions/create-github-app-token/compare/v2.2.2...v3.2.0',
          commits: [{ commit: { message: 'Add enterprise GitHub App support.' } }],
        })
      );

    const input = await collectReviewInput(
      {
        pull_request: {
          ...pullRequest,
          body: 'Updates `actions/create-github-app-token` from 2.2.2 to 3.2.0',
        },
        repository: 'owner/repo',
        files: [],
      },
      { fetchLike: fetchMock }
    );

    expect(input?.packages[0].sources).toMatchObject([
      {
        kind: 'repository-compare',
        url: 'https://github.com/actions/create-github-app-token/compare/v2.2.2...v3.2.0',
      },
    ]);
    expect(fetchMock.mock.calls[3][0]).toContain('/compare/v2.2.2...v3.2.0');
  });

  it('retains updates with an explicit unavailable-evidence result', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(actionDependencyDiff))
      .mockResolvedValue(new Response(null, { status: 404 }));

    const input = await collectReviewInput(
      {
        pull_request: {
          ...pullRequest,
          body: 'Updates `actions/create-github-app-token` from 2.2.2 to 3.2.0',
        },
        repository: 'owner/repo',
        files: [],
      },
      { fetchLike: fetchMock }
    );

    expect(input?.packages).toMatchObject([
      {
        name: 'actions/create-github-app-token',
        evidence: {
          status: 'unavailable',
          reason: 'No upstream release or comparison was available for this version range.',
        },
        sources: [],
      },
    ]);
  });

  it('degrades a failed upstream request to unavailable evidence', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(actionDependencyDiff))
      .mockRejectedValueOnce(new TypeError('network failure'));

    await expect(
      collectReviewInput(
        {
          pull_request: {
            ...pullRequest,
            body: 'Updates `actions/create-github-app-token` from 2.2.2 to 3.2.0',
          },
          repository: 'owner/repo',
          files: [],
        },
        { fetchLike: fetchMock }
      )
    ).resolves.toMatchObject({
      packages: [{ evidence: { status: 'unavailable' }, sources: [] }],
    });
  });

  it('uses release notes within the upgrade range as partial evidence', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(actionDependencyDiff))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(
        response([
          {
            tag_name: 'v3.0.0',
            html_url: 'https://github.com/actions/create-github-app-token/releases/tag/v3.0.0',
            name: 'v3.0.0',
            body: 'Adds enterprise-level GitHub App support.',
          },
        ])
      );

    const input = await collectReviewInput(
      {
        pull_request: {
          ...pullRequest,
          body: 'Updates `actions/create-github-app-token` from 2.2.2 to 3.2.0',
        },
        repository: 'owner/repo',
        files: [],
      },
      { fetchLike: fetchMock }
    );

    expect(input?.packages[0]).toMatchObject({
      evidence: { status: 'partial' },
      sources: [
        {
          url: 'https://github.com/actions/create-github-app-token/releases/tag/v3.0.0',
          range: { from: '3.0.0', to: '3.0.0' },
        },
      ],
    });
    expect(fetchMock.mock.calls[7][0]).toContain('/releases?per_page=100');
  });

  it('follows release-list pagination to find evidence within the upgrade range', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(actionDependencyDiff))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify([]), {
          headers: {
            Link: '<https://api.github.com/repos/actions/create-github-app-token/releases?per_page=100&page=2>; rel="next"',
          },
        })
      )
      .mockResolvedValueOnce(
        response([
          {
            tag_name: 'v3.0.0',
            html_url: 'https://github.com/actions/create-github-app-token/releases/tag/v3.0.0',
            body: 'Adds enterprise-level GitHub App support.',
          },
        ])
      );

    const input = await collectReviewInput(
      {
        pull_request: {
          ...pullRequest,
          body: 'Updates `actions/create-github-app-token` from 2.2.2 to 3.2.0',
        },
        repository: 'owner/repo',
        files: [],
      },
      { fetchLike: fetchMock }
    );

    expect(input?.packages[0]).toMatchObject({
      evidence: { status: 'partial' },
      sources: [{ url: 'https://github.com/actions/create-github-app-token/releases/tag/v3.0.0' }],
    });
  });

  it('uses npm metadata as partial evidence when upstream releases are unavailable', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(dependencyDiff))
      .mockResolvedValueOnce(
        response({
          repository: { url: 'https://github.com/example/package' },
          versions: { '2.0.0': { description: 'Example package metadata.' } },
        })
      )
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(response([]));

    const input = await collectReviewInput(
      {
        pull_request: pullRequest,
        repository: 'owner/repo',
        files: [packageFile],
      },
      { fetchLike: fetchMock }
    );

    expect(input?.packages[0]).toMatchObject({
      evidence: { status: 'partial' },
      sources: [
        {
          kind: 'package-metadata',
          url: 'https://registry.npmjs.org/example',
          range: { from: '2.0.0', to: '2.0.0' },
        },
      ],
    });
  });

  it('includes an Action update from the workflow diff when the dependency graph omits it', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(
        response({
          html_url: 'https://github.com/actions/create-github-app-token/releases/tag/v3.2.0',
          name: 'v3.2.0',
          body: 'Adds enterprise-level GitHub App support.',
        })
      );

    const input = await collectReviewInput(
      {
        pull_request: {
          ...pullRequest,
          body: 'Updates `actions/create-github-app-token` from 2.2.2 to 3.2.0',
        },
        repository: 'owner/repo',
        files: [workflowFile],
      },
      { fetchLike: fetchMock }
    );

    expect(input?.packages).toMatchObject([
      {
        name: 'actions/create-github-app-token',
        from: '2.2.2',
        to: '3.2.0',
        dependencyType: 'direct:workflow',
      },
    ]);
  });

  it('uses dependency review versions instead of package.json semver ranges', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(dependencyDiff))
      .mockResolvedValueOnce(
        response({ repository: { url: 'https://github.com/example/package' } })
      )
      .mockResolvedValueOnce(
        response({
          html_url: 'https://github.com/example/package/releases/tag/v2.0.0',
          name: 'v2.0.0',
          body: 'No migration required.',
        })
      );

    const input = await collectReviewInput(
      {
        pull_request: pullRequest,
        repository: 'owner/repo',
        files: [packageFile],
      },
      { fetchLike: fetchMock }
    );

    if (!input) throw new Error('Expected a Dependabot review packet.');
    expect(fetchMock.mock.calls[0][0]).toContain('dependency-graph/compare/base...head');
    expect(input.packages).toMatchObject([{ name: 'example', from: '1.0.0', to: '2.0.0' }]);
    expect(fetchMock.mock.calls[2][0]).toContain('/releases/tags/v2.0.0');
  });

  it('only creates a codemod finding when the release note proves the upgraded range applies', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(dependencyDiff))
      .mockResolvedValueOnce(
        response({ repository: { url: 'https://github.com/example/package' } })
      )
      .mockResolvedValueOnce(
        response({
          html_url: 'https://github.com/example/package/releases/tag/v2.0.0',
          name: 'v2.0.0',
          body: 'For older projects, run npx example-codemod migrate.',
        })
      );

    const input = await collectReviewInput(
      {
        pull_request: pullRequest,
        repository: 'owner/repo',
        files: [packageFile],
      },
      { fetchLike: fetchMock }
    );

    if (!input) throw new Error('Expected a Dependabot review packet.');
    expect(input.packages[0].findings).toEqual([]);
  });

  it('records an applicable codemod with its exact finding ID', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(dependencyDiff))
      .mockResolvedValueOnce(
        response({ repository: { url: 'https://github.com/example/package' } })
      )
      .mockResolvedValueOnce(
        response({
          html_url: 'https://github.com/example/package/releases/tag/v2.0.0',
          name: 'v2.0.0',
          body: 'To migrate from v1.0.0 to v2.0.0, run npx example-codemod migrate.',
        })
      );

    const input = await collectReviewInput(
      {
        pull_request: pullRequest,
        repository: 'owner/repo',
        files: [packageFile],
      },
      { fetchLike: fetchMock }
    );

    if (!input) throw new Error('Expected a Dependabot review packet.');
    expect(input.packages[0].findings).toMatchObject([
      {
        id: 'example:applicable-codemod:https://github.com/example/package/releases/tag/v2.0.0',
      },
    ]);
  });

  it('includes dependency-review vulnerabilities and licenses in the packet', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        response([
          ...dependencyDiff,
          {
            change_type: 'added',
            manifest: 'package.json',
            ecosystem: 'npm',
            name: 'example',
            version: '2.0.0',
            source_repository_url: 'https://github.com/example/package',
            license: 'MIT',
            vulnerabilities: [
              {
                advisory_ghsa_id: 'GHSA-example',
                advisory_summary: 'Example vulnerability.',
                advisory_url: 'https://github.com/advisories/GHSA-example',
                severity: 'high',
              },
            ],
          },
        ])
      )
      .mockResolvedValueOnce(
        response({ repository: { url: 'https://github.com/example/package' } })
      )
      .mockResolvedValueOnce(
        response({
          html_url: 'https://github.com/example/package/releases/tag/v2.0.0',
          body: 'Release notes.',
        })
      );

    const input = await collectReviewInput(
      {
        pull_request: pullRequest,
        repository: 'owner/repo',
        files: [packageFile],
      },
      { fetchLike: fetchMock }
    );

    if (!input) throw new Error('Expected a Dependabot review packet.');
    expect(input.packages[0]).toMatchObject({
      license: 'MIT',
      findings: [
        {
          kind: 'vulnerability',
          sourceUrl: 'https://github.com/advisories/GHSA-example',
          severity: 'high',
        },
      ],
    });
  });

  it('treats an unknown dependency-review severity as unscored', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        response([
          ...dependencyDiff,
          {
            change_type: 'added',
            manifest: 'package.json',
            ecosystem: 'npm',
            name: 'example',
            version: '2.0.0',
            source_repository_url: 'https://github.com/example/package',
            license: 'MIT',
            vulnerabilities: [
              {
                advisory_ghsa_id: 'GHSA-example',
                advisory_summary: 'Example vulnerability.',
                advisory_url: 'https://github.com/advisories/GHSA-example',
                severity: 'future-severity',
              },
            ],
          },
        ])
      )
      .mockResolvedValueOnce(
        response({ repository: { url: 'https://github.com/example/package' } })
      )
      .mockResolvedValueOnce(
        response({
          html_url: 'https://github.com/example/package/releases/tag/v2.0.0',
          body: 'Release notes.',
        })
      );

    const input = await collectReviewInput(
      {
        pull_request: pullRequest,
        repository: 'owner/repo',
        files: [packageFile],
      },
      { fetchLike: fetchMock }
    );

    expect(input?.packages[0].findings).toMatchObject([{ kind: 'vulnerability', severity: null }]);
  });
});
