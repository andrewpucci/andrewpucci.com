import { parseReviewInput } from './schema.mjs';

const githubRepository = (value) => {
  const match =
    typeof value === 'string' && value.match(/github\.com[/:]([^/]+\/[^/#.]+)(?:\.git)?/i);
  return match?.[1];
};

export async function collectReviewInput(event, fetchLike = fetch) {
  const pullRequest = event.pull_request;
  if (pullRequest?.user?.login !== 'dependabot[bot]') return null;
  const packageJson = (event.files ?? []).find((file) => file.filename === 'package.json');
  const changes = [...(packageJson?.patch ?? '').matchAll(/^[+-]\s+"([^"]+)":\s+"([^"]+)"/gm)];
  const versions = new Map();
  for (const [, name, version] of changes)
    versions.set(name, [...(versions.get(name) ?? []), version]);
  const packages = await Promise.all(
    [...versions]
      .filter(([, versions]) => versions.length >= 2)
      .map(async ([name, versions]) => {
        const [from, to] = versions;
        const metadata = await fetchLike(
          `https://registry.npmjs.org/${encodeURIComponent(name)}`
        ).then((response) => (response.ok ? response.json() : {}));
        const repository = githubRepository(metadata.repository?.url);
        let source = null;
        if (repository) {
          const release = await fetchLike(
            `https://api.github.com/repos/${repository}/releases/tags/v${to}`
          ).then((response) => (response.ok ? response.json() : null));
          if (release?.html_url && typeof release.body === 'string')
            source = {
              kind: 'release-notes',
              url: release.html_url,
              title: release.name || `${name} ${to}`,
              excerpt: release.body.slice(0, 12_000),
            };
        }
        const command = source?.excerpt.match(
          /(?:npx|pnpm dlx|yarn dlx)\s+[^\n`]+(?:codemod|migrate)[^\n`]*/i
        )?.[0];
        const findings = command
          ? [
              {
                kind: 'applicable-codemod',
                reason: `Run the upstream codemod for ${name}.`,
                sourceUrl: source.url,
                remediation: [command],
                validation: ['npm run check', 'npm test'],
                codemodCommand: command,
              },
            ]
          : [];
        return {
          name,
          from,
          to,
          dependencyType: 'unknown',
          sources: source ? [source] : [],
          findings,
        };
      })
  );
  return parseReviewInput({
    pullRequest: {
      number: pullRequest.number,
      baseSha: pullRequest.base.sha,
      headSha: pullRequest.head.sha,
    },
    packages,
  });
}
