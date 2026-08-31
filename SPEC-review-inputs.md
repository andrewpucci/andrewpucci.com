# Spec: `review-inputs`

## Objective

Build the evidence-collection module for Dependabot pull requests in this repository. It gives the later analysis module an auditable, bounded review packet for each npm upgrade without checking out or executing pull-request code.

The user is the repository maintainer reviewing a Dependabot pull request. Success means the maintainer can see exactly what dependency changed, what GitHub reports about its security and license status, and which official upstream documents support any migration or codemod finding.

## Tech Stack

- GitHub Actions on GitHub-hosted Ubuntu runners.
- GitHub REST API authenticated with the workflow `GITHUB_TOKEN`.
- Node.js 24 and its built-in `fetch`; no new runtime package is required for input collection.
- npm 11 with committed `package-lock.json`.
- `review-analysis` will use `mistral-medium-latest`; this module never receives an API key or calls an LLM.

## Commands

```sh
# Static and formatting checks
vp check
npm run check:svelte
npm run lint

# Non-rendering tests
npm test
npm run test:coverage

# Full local regression path
npm run test:ci
```

Workflow-specific tests will use mocked GitHub REST responses and run in Vitest. The implementation must not require a live GitHub API call to test parsing, source selection, pagination, or failure handling.

## Project Structure

```text
.github/workflows/dependabot-intelligent-review.yml
  → Orchestration only; calls review-inputs before later modules.

.github/actions-scripts/dependabot-review/
  inputs.ts
    → GitHub API collection and bounded review-packet construction.
  inputs.test.ts
    → Vitest coverage of API-result parsing, source validation, and errors.
  schema.ts
    → Shared TypeScript types and runtime validation for the review packet.

SPEC-review-inputs.md
  → This module contract.
```

The eventual workflow and implementation files are listed for planning only; they are not created by this specification.

## Code Style

Use TypeScript, ESM imports, small pure transformation functions, and explicit runtime validation at network boundaries. Treat every value received from GitHub, package registries, release notes, and pull-request files as untrusted data. Do not interpolate those values into shell scripts.

```ts
type EvidenceSource = {
  kind: 'release-notes' | 'migration-guide' | 'codemod-guide';
  url: URL;
  title: string;
  excerpt: string;
};

function isOfficialSource(url: URL, canonicalHosts: ReadonlySet<string>): boolean {
  return url.protocol === 'https:' && canonicalHosts.has(url.hostname);
}
```

Network results must be capped by item count and byte length before entering the review packet. Omit response bodies from workflow logs.

## Testing Strategy

Use Vitest for non-rendering logic, consistent with ADR-0010.

- Unit-test filtering: non-Dependabot actors produce no packet.
- Unit-test pagination and the GitHub pull-request-file API's truncated/absent patches.
- Unit-test package-delta normalization for direct and transitive npm changes.
- Unit-test source selection: canonical official links are accepted; malformed, non-HTTPS, redirecting-to-unapproved-host, or community links are excluded.
- Unit-test codemod extraction: only an explicit official command plus applicable version range creates a codemod finding.
- Unit-test graceful degradation: unavailable dependency review data, release notes, or source metadata produces an explicit `unknown`/`manual_migration_review_required` result, never fabricated evidence.
- Integration-test the workflow's permissions, actor gate, and no-checkout property through static workflow assertions or a mocked workflow harness.

## Boundaries

### Always

- Run only for `dependabot[bot]` pull requests and pass the pull request number, base SHA, and head SHA explicitly.
- Use least privilege: `contents: read` and only the additional read permission required for pull-request metadata.
- Fetch dependency differences through GitHub's dependency-review API when available.
- Obtain package metadata from the npm registry, then follow only canonical upstream repository/homepage links.
- Require an official source URL, exact command, and applicable version range before reporting a codemod.
- Record provenance for every evidence item and return bounded excerpts rather than whole documents.

### Ask First

- Supporting an additional package ecosystem.
- Adding a third-party GitHub Action or Node dependency.
- Sending repository source files beyond changed manifests/lockfiles to any external service.
- Changing repository Actions permissions or enabling GitHub Code Security features.
- Treating an optional upstream codemod as non-blocking.

### Never

- Check out, install, build, test, or execute pull-request code.
- Run a discovered codemod.
- Log `GITHUB_TOKEN`, Dependabot secrets, package registry credentials, or upstream document bodies.
- Treat blogs, issue comments, release aggregators, or model knowledge as evidence for a migration/codemod blocker.
- Invent a package feature, migration command, release note, or codemod applicability.

## Success Criteria

1. A Dependabot npm pull request produces one schema-valid review packet containing the pull request identity, exact base/head SHAs, package version changes, source/dependency classification, and provenance.
2. The packet includes GitHub dependency-review vulnerability and license findings when that API is available; an unavailable response is represented explicitly without failing open.
3. For every changed direct package, the packet includes bounded, official upstream release/migration evidence between the old and new versions when available.
4. A codemod finding is emitted only when official evidence includes a concrete command and an applicable version range; its result marks the later verdict as eligible for `do_not_merge`.
5. No workflow step checks out or executes pull-request code, and no external data is executed as a shell command.
6. All tests in this module run offline with mocked network inputs, and the repository's applicable validation commands pass.

## Recorded Handoff Decisions

- `review-analysis` will use `mistral-medium-latest`; its budget and latency ceiling belong in that module's specification.
- Official codemods whose applicability cannot be proven from public evidence are reported as `manual_migration_review_required`, not as merge blockers.
