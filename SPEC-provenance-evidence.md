# Spec: Provenance Evidence for Dependabot Decisions — 2026-09-07

**Status:** Approved for planning — 2026-09-07

The advisory-only provenance contract and its privacy boundary are approved. No
implementation follows until the implementation plan is approved.

## Objective

Give the repository maintainer an integrity signal for the exact npm dependency
tree proposed by a Dependabot pull request. The signal answers a narrow
question: did npm report missing or invalid registry signatures or provenance
attestations for that lockfile?

This is evidence for the later `decision-reporting` module. It must not become a
CI replacement, a required status check, or a deterministic verdict ceiling.
The existing review must still post or update its GitHub comment when provenance
cannot be collected.

### User story

As the maintainer reviewing a Dependabot update, I can distinguish a verified
public-npm lockfile from one with integrity concerns or unavailable evidence,
without the reviewer executing pull-request code or hiding its normal comment.

### Why this design

`npm audit signatures` verifies public-registry signatures and provenance
attestations. The npm CLI documents lockfile-only mode as ignoring
`node_modules`; this repository's validated command returned empty `invalid`
and `missing` lists for the current lockfile. The command is therefore suitable
as a bounded advisory input when run against a fetched lockfile rather than a
checked-out pull-request workspace. [npm audit](https://docs.npmjs.com/cli/v11/commands/npm-audit/)

The command can report errors for missing or invalid signatures or attestations.
That is a reason to show evidence requiring attention, not an automatic reason
to reject an otherwise appropriate update. [Viewing package provenance](https://docs.npmjs.com/viewing-package-provenance/)

## Assumptions

1. Dependabot npm pull requests continue to include `package-lock.json`.
2. The review workflow continues to execute trusted default-branch code after
   CI and must never check out or run code from the pull request.
3. The repository uses the public npm registry for its committed lockfile.
4. Provenance evidence is advisory until the maintainer explicitly chooses a
   blocking policy; this module will not make that policy change.

If any assumption is wrong, revise this specification before planning.

## Provenance contract

### Inputs

For a Dependabot npm pull request, the collector must:

1. Retrieve the full `package-lock.json` at the pull request's immutable head
   SHA using GitHub's contents API and the existing read-only GitHub token.
2. Parse the lockfile before invoking npm. If any resolved package points to a
   non-public registry, a git URL, a local file, or an otherwise unsupported
   source, do not submit the lockfile to npm; return `unavailable` with a
   concise reason.
3. Write only the validated lockfile to an action-owned temporary directory.
   Do not check out the pull request, retrieve its `package.json`, install its
   dependencies, or execute its lifecycle scripts.

The collector may send the public dependency graph needed by npm to
`https://registry.npmjs.org`. It must not send repository source, GitHub tokens,
model credentials, or raw error output to the model or the public PR comment.

### Invocation

Run the following command with argument-array subprocess APIs, never a shell:

```text
npm audit signatures --json --package-lock-only --ignore-scripts
```

Run it with the temporary directory as its working directory, an action-owned
npm cache, and a 30-second timeout. Do not pass `--include-attestations`: full
attestation bundles are not needed for a maintainer decision and would enlarge
the review input unnecessarily.

The collector must remove the temporary directory and cache after the subprocess
finishes, times out, or fails.

### Output

The module supplies one top-level review-input value:

```ts
type ProvenanceEvidence =
  | { status: 'verified'; invalid: []; missing: []; reason: null }
  | {
      status: 'attention_required';
      invalid: string[];
      missing: string[];
      reason: null;
    }
  | { status: 'unavailable'; invalid: []; missing: []; reason: string };
```

Interpret npm's JSON defensively:

- `verified`: the subprocess returns valid JSON with empty `invalid` and
  `missing` arrays.
- `attention_required`: valid JSON identifies one or more invalid or missing
  entries, regardless of the process exit status.
- `unavailable`: the lockfile cannot be retrieved or safely used, the command
  times out, npm fails without usable JSON, or the JSON has an unexpected shape.

Only bounded package identifiers and counts may cross this module boundary.
Raw npm output, registry response bodies, cache paths, and error stacks must not
be included in review input, logs, the model prompt, or the GitHub comment.

`decision-reporting` will later decide how this value appears to maintainers.
Until that module is specified, provenance collection does not alter the
existing comment body, policy evaluation, model request, or verdict.

## Tech stack

- Node.js ESM action scripts in `.github/actions-scripts/dependabot-review/`
- npm CLI, currently declared as `npm@11.16.0` in `package.json`
- GitHub REST contents API, using the action's existing read-only token
- Vitest through the repository's Vite+ test runner

## Commands

```text
# Inspect a PR's existing review input without retrieving the model credential
npm run dependabot:review:dry-run -- 271 --preflight

# Run the provenance command against a local lockfile without node_modules
npm audit signatures --json --package-lock-only --ignore-scripts

# Validate the implementation
npm run lint
npm run check
npm test
npm run build
```

## Project structure

```text
CAPABILITY-MAP-dependabot-upgrade-decision-evidence.md  approved module index
SPEC-provenance-evidence.md                            this module specification
.github/actions-scripts/dependabot-review/
  review.mjs                                           trusted orchestration boundary
  inputs.mjs                                           GitHub PR and upstream evidence collection
  provenance.mjs                                      proposed provenance collector
  schema.mjs                                          proposed validated input contract
  provenance.test.ts                                  proposed focused unit/subprocess tests
.github/workflows/dependabot-intelligent-review.yml   trusted workflow; runtime changes ask first
```

## Code style

Use small, injected-boundary functions so process execution and HTTP retrieval
are testable without network access. Parse untrusted values at the boundary and
return a safe, typed fallback rather than throwing from the advisory path.

```js
export async function collectProvenance({ lockfile, runCommand }) {
  const result = await runCommand('npm', ['audit', 'signatures', '--json']);
  return parseProvenanceResult(result, lockfile);
}
```

Names use verbs for operations (`collectProvenance`) and nouns for validated
values (`provenanceEvidence`). Use ESM imports, single quotes, repository
formatting, and source-adjacent `*.test.ts` files. No code comments are needed
unless they explain a non-obvious security boundary.

## Testing strategy

Focused tests in `provenance.test.ts` must cover:

1. A valid empty `invalid`/`missing` response produces `verified`.
2. Valid non-empty `invalid` or `missing` responses produce
   `attention_required` without changing policy or verdict.
3. Missing lockfile, unsupported registry source, timeout, nonzero process
   failure without valid JSON, and malformed output all produce `unavailable`.
4. The subprocess receives the exact non-shell argv, temporary working
   directory, isolated cache, `--package-lock-only`, and `--ignore-scripts`.
5. All temporary paths are removed for success, failure, and timeout.
6. `loadReviewInput` combines unavailable provenance with normal review input;
   `buildReviewComment` and the production comment upsert still run.

Run the full existing test suite, lint, static checks, and production build.
The existing local dry run remains a manual regression check; `--preflight` must
stay credential-free.

## Boundaries

### Always

- Use the immutable pull-request head SHA and the existing read-only token.
- Treat the lockfile, npm output, registry responses, and subprocess errors as
  untrusted data.
- Use a hard timeout and clean up all temporary resources.
- Preserve the existing GitHub comment upsert/delete behavior.
- Return `unavailable` rather than failing the reviewer when provenance cannot
  be collected.

### Ask first

- Editing `.github/workflows/dependabot-intelligent-review.yml`, including
  pinning Node or npm for provenance verification.
- Adding an npm dependency or a new secret, token, cache service, or artifact.
- Turning provenance evidence into a required check or deterministic merge rule.
- Sending provenance data to a service other than the public npm registry.

### Never

- Check out, install, build, test, or execute pull-request code in the
  privileged `workflow_run` context.
- Run npm through a shell or permit lifecycle scripts.
- Send tokens, model credentials, raw npm output, or full attestations to the
  model or the pull-request comment.
- Replace, suppress, or delete the existing review comment because provenance
  collection is unavailable.

## Success criteria

1. A Dependabot npm PR with a public-registry `package-lock.json` yields a
   validated `verified`, `attention_required`, or `unavailable` value within 30
   seconds of starting the provenance command.
2. No provenance path checks out PR code, installs packages, runs lifecycle
   scripts, or uses a shell subprocess.
3. Unsupported or failed collection is visible to downstream reporting as
   `unavailable` and does not prevent the existing intelligent-review comment
   from being posted or updated.
4. Valid signature or attestation concerns are represented as
   `attention_required`, not a policy verdict or required status check.
5. Tests prove the status mapping, process boundary, cleanup, and unchanged
   comment-flow behavior; repository lint, checks, tests, and build pass.

## Approved decisions

1. The workflow will explicitly provision the current npm verifier, pinned to
   `npm@12.0.2` rather than relying on the runner's npm or a floating `latest`
   tag. Future verifier upgrades are deliberate review changes.
2. A lockfile containing private-registry, git, local, or otherwise unsupported
   dependency sources returns `unavailable`; it is never transmitted to the
   public npm registry.

## Sources

- [npm audit: signatures, provenance attestations, JSON, and lockfile-only mode](https://docs.npmjs.com/cli/v11/commands/npm-audit/)
- [npm provenance: missing or invalid signatures/attestations](https://docs.npmjs.com/viewing-package-provenance/)
- [npm provenance statements: purpose and verification guidance](https://docs.npmjs.com/generating-provenance-statements/)
