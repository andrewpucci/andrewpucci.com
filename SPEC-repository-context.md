# Spec: Dependabot repository context — 2026-09-06

## Objective

Provide the review with small, trusted facts about how this repository uses an upgraded dependency, so classifications such as `use_now` are grounded in actual project context rather than generic release notes.

## Tech Stack

Node.js ESM and the already checked-out default branch in the privileged `workflow_run` workflow. Static file parsing/search only; no PR checkout, code execution, or new package is required.

## Commands

```sh
npm test -- .github/actions-scripts/dependabot-review/inputs.test.ts
npm run lint
npm test
```

## Project Structure

```text
.github/actions-scripts/dependabot-review/inputs.mjs       → assemble trusted context
.github/actions-scripts/dependabot-review/schema.mjs       → validate context packet fields
.github/actions-scripts/dependabot-review/inputs.test.ts   → context extraction tests
```

## Code Style

Represent every fact with its trusted path and a bounded excerpt.

```js
{ kind: 'workflow-action-input', path: '.github/workflows/frontend.yml', excerpt: 'node-version: 24' }
```

Use allowlists rather than broad filesystem traversal. Source paths are repository-relative and excerpts are plain data.

## Requirements

1. Read only the trusted default-branch checkout made by `workflow_run`; do not fetch, check out, parse, or execute content from the PR head.
2. Allow context from dependency and lock manifests, workflow YAML `uses` and `with` blocks, runtime/build configuration, and targeted static source searches for the upgraded package or action identifier.
3. Exclude environment files, credential-like paths, generated output, binaries, and arbitrary broad file dumps.
4. Associate context facts with a specific reviewed package/action. Each fact includes a kind, repository-relative path, and excerpt.
5. Cap individual excerpts and the aggregate context packet. If a cap is reached, report that the context is partial rather than silently truncating its meaning.
6. Supply context only as evidence of current usage or configuration; it must not be used to infer unverified upstream changes.

## Testing Strategy

Use temporary fixture content or injected readers to test allowlisted extraction, disallowed paths, bounded excerpts, action inputs, package usage, no-match behavior, and aggregate limits. Tests must show that PR-provided text cannot influence context.

## Boundaries

- Always: label every context fact with its path and enforce allowlists and size limits.
- Ask first: expand the allowlist to a new file class or include non-public repository data.
- Never: read `.env`-style files, secrets, user home directories, or execute repository code.

## Success Criteria

- A workflow-action upgrade identifies its existing trusted `uses` and relevant `with` inputs.
- An npm upgrade can identify bounded, trusted static usage where present.
- No excluded file's contents can enter the model packet.
- Context limits and partial-context signals are regression-tested.

## Open Questions

None. The initial allowlist is intentionally narrow and may be extended only through review.
