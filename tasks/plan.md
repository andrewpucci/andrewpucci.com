# Implementation Plan: Dependabot Intelligent Review

## Overview

Add an advisory GitHub Actions workflow that reviews npm Dependabot pull requests. It will collect bounded, official evidence, use `mistral-medium-latest` to assess new functionality and migration risk, and maintain one updatable pull-request conversation comment with a verdict and remediation guidance. It never executes PR code, codemods, or generated prompts, and it never approves, requests changes, or merges.

## Architecture Decisions

- **Three sequential modules:** `review-inputs` produces a validated evidence packet; `review-analysis` produces a validated Mistral assessment; `review-reporting` renders the result. This follows [the approved capability map](../CAPABILITY-MAP-dependabot-intelligent-review.md).
- **No PR checkout:** GitHub REST APIs and public package metadata provide the required information. This avoids executing Dependabot PR content in a secret-bearing workflow.
- **Deterministic gates retain authority:** GitHub Dependency Review and existing CI remain merge gates. Mistral produces advisory recommendations only.
- **Official-source-only blockers:** a `do_not_merge` verdict requires an input finding with official evidence. An applicable documented codemod blocks a plain Dependabot bump; unproven applicability becomes manual review.
- **One updatable conversation comment:** use an issue-style comment marked with a hidden identifier and head SHA. This avoids duplicate notifications from repeated submitted reviews.
- **Raw HTTPS and `.mjs` by default:** use Node 24 `fetch` and directly executable ESM modules to avoid adding either an SDK or TypeScript runtime dependency.

## Dependency Graph

```text
GitHub PR / dependency APIs + official upstream sources
                    │
                    ▼
            review-inputs packet
                    │
                    ▼
     Mistral JSON response + local validation
                    │
                    ▼
          review-analysis result
                    │
                    ▼
        review-reporting PR comment
                    │
                    ▼
GitHub Actions orchestration and permissions
```

## Task List

Tasks are recorded in [todo.md](todo.md).

### Phase 1: Input foundation

- [ ] Task 1: Define shared review contracts and validation
- [ ] Task 2: Collect and normalize Dependabot review inputs

### Checkpoint: Input foundation

- [ ] Focused Vitest tests pass.
- [ ] Input packets contain only bounded, provenance-tagged data.
- [ ] No pull-request checkout or execution path exists.

### Phase 2: Analysis and report slices

- [ ] Task 3: Analyze validated evidence with Mistral
- [ ] Task 4: Render and upsert the advisory PR comment

### Checkpoint: Analysis and reporting

- [ ] Focused Vitest tests cover valid, malformed, unavailable, and codemod paths.
- [ ] A `do_not_merge` result contains evidence, remediation, validation, and a prompt.
- [ ] Reporting is idempotent and cannot create duplicate active comments.

### Phase 3: Workflow integration

- [ ] Task 5: Wire the hardened Dependabot workflow and document setup

### Checkpoint: Complete

- [ ] `vp check` and `npm run check:svelte` pass.
- [ ] `npm run test:coverage` passes.
- [ ] Workflow actor gate, permissions, and no-checkout behavior are verified.
- [ ] `MISTRAL_API_KEY` is configured as a Dependabot secret outside version control.
- [ ] Human review confirms the rendered comment on a test Dependabot PR.

## Risks and Mitigations

| Risk                                                         | Impact | Mitigation                                                                                                  |
| ------------------------------------------------------------ | ------ | ----------------------------------------------------------------------------------------------------------- |
| Dependabot workflows cannot use ordinary Actions secrets     | High   | Require `MISTRAL_API_KEY` as a Dependabot secret; report a neutral unavailable result when absent.          |
| Upstream release notes are incomplete or hostile             | High   | Use canonical official sources only, cap excerpts, preserve provenance, and never invent codemods/features. |
| Model output is malformed or unsupported                     | Medium | Use JSON mode, local schema validation, bounded retries, and `analysis_unavailable` on failure.             |
| Model advice could be mistaken for a hard gate               | High   | Clearly label the comment advisory; retain GitHub Dependency Review and CI as merge authority.              |
| Repeated Dependabot pushes create noisy comments             | Medium | Update one bot-authored, marker-bearing comment per PR.                                                     |
| Private-repository dependency-review data may be unavailable | Medium | Model the missing data explicitly and require manual review rather than failing open.                       |
| `mistral-medium-latest` changes over time                    | Low    | Record the returned model identifier when available and keep the model choice in the module spec.           |

## Open Questions

None. Runtime setup requires adding `MISTRAL_API_KEY` as a Dependabot secret before end-to-end use.
