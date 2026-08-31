import { describe, expect, it, vi } from 'vite-plus/test';
import { collectReviewInput } from './inputs.mjs';

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

function response(value: unknown) {
  return new Response(JSON.stringify(value));
}

describe('collectReviewInput', () => {
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
        },
      ],
    });
  });
});
