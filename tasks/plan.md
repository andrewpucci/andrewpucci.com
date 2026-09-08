# Implementation Plan: Dependabot intelligent review improvements

## Overview

Implement the approved Dependabot-review improvements as small,
dependency-ordered slices. Phases 1–3 are complete; Phase 4 adds advisory npm
provenance evidence without making it a CI gate or changing the current comment.
The plan keeps GitHub CI outside the review comment and retains the existing
trust boundary: the workflow runs only trusted default-branch code and never
executes PR content, dependencies, or codemods.

Tasks are tracked in GitHub Issues, as required by the repository issue-tracker convention. The links below are the authoritative task records; this file is their dependency and checkpoint index.

## Architecture Decisions

- Gather evidence and trusted repository context independently, then combine them in a deterministic policy before invoking Mistral.
- Treat unavailable or partial evidence as a verdict constraint, not an instruction the model may override.
- Preserve the model as a bounded summarizer and classifier; source attribution, compatibility findings, and verdict ceilings remain validated program state.
- Render the managed comment from structured analysis, prioritizing decisions and actions over upstream release-note detail.
- Run provenance verification against an immutable PR lockfile and a strictly
  validated manifest `overrides` map in an isolated temporary directory after
  a script-free, public-registry-only install; unsupported sources and command
  failures become advisory-unavailable evidence, never a failed comment
  workflow.

## Dependency Graph

```text
#274 Paginated PR files
 ├── #276 Range-aware evidence ─┐
 └── #275 Trusted context ──────┼── #279 Deterministic policy
                                │       │
                                │       └── #277 Constrained Mistral analysis
                                │                 │
                                │                 └── #278 Scannable comment
                                │                           │
                                └───────────────────────────┴── #280 Workflow orchestration

#292 Pinned npm verifier ────────────────────┐
                                               ├── #293 Trusted provenance wiring
#290 Provenance collector → #291 Input isolation ┘
```

## Task List

### Phase 1: Complete the review packet

- [x] [#274: Paginate PR files](https://github.com/andrewpucci/andrewpucci.com/issues/274) — Foundation for complete dependency extraction. No dependencies; small.
- [x] [#276: Collect range-aware evidence](https://github.com/andrewpucci/andrewpucci.com/issues/276) — Fallback ladder and provenance/status fields. Depends on #274; medium.
- [x] [#275: Add bounded trusted repository context](https://github.com/andrewpucci/andrewpucci.com/issues/275) — Allowlisted static context for package/action relevance. Depends on #274; medium.

### Checkpoint: Review packet

- [x] Focused pagination, evidence, and context tests pass.
- [x] `npm run lint` passes.
- [x] Review packet contains only bounded, attributable upstream data and allowlisted trusted context.
- [x] Human review before policy work.

### Phase 2: Constrain the recommendation

- [x] [#279: Enforce deterministic review policy](https://github.com/andrewpucci/andrewpucci.com/issues/279) — Verdict ceilings and validated security/compatibility findings. Depends on #276 and #275; medium.
- [x] [#277: Constrain Mistral analysis with policy and context](https://github.com/andrewpucci/andrewpucci.com/issues/277) — Validated model contract, bounded model-packet projection, adaptive batches, and deterministic aggregation. The batching foundation is policy-independent; policy verdict ceilings remain blocked on #279. Medium.

### Checkpoint: Decision integrity

- [x] Focused policy, schema, and analysis tests pass.
- [x] `npm run lint` passes.
- [x] Fixtures prove missing evidence cannot yield `merge` and unsupported model citations are rejected.
- [x] Human review before comment redesign.

### Phase 3: Present and wire the decision

- [x] [#278: Render a scannable decision comment](https://github.com/andrewpucci/andrewpucci.com/issues/278) — Visible actionable groups, collapsed non-relevant detail, and evidence follow-ups. Depends on #277; small.
- [x] [#280: Verify end-to-end workflow orchestration](https://github.com/andrewpucci/andrewpucci.com/issues/280) — Runner wiring and managed-comment lifecycle tests. Depends on #277 and #278; small.

### Checkpoint: Complete

- [x] All focused tests and `npm run lint` pass.
- [x] `npm test` passes.
- [x] The workflow test fixture confirms no PR code is checked out or executed.
- [x] Review against the five approved specs and capability map.

### Phase 4: Advisory provenance evidence

- [x] [#292: Pin the npm provenance verifier](https://github.com/andrewpucci/andrewpucci.com/issues/292) — Provision the exact, approved npm verifier in the trusted workflow. No dependencies; small.
- [x] [#290: Collect advisory npm provenance evidence](https://github.com/andrewpucci/andrewpucci.com/issues/290) — Validate public npm lockfiles and collect bounded `verified`, `attention_required`, or `unavailable` evidence. No dependencies; small.
- [x] [#291: Validate and isolate provenance input](https://github.com/andrewpucci/andrewpucci.com/issues/291) — Add the validated input contract while keeping provenance out of policy, the model packet, and the current comment. Depends on #290; medium.

### Checkpoint: Provenance foundation

- [x] Focused verifier, collector, schema, and model-projection tests pass.
- [x] `npm run lint`, `npm run check`, and `npm test` pass.
- [x] Review confirms there is no private-source transmission, shell subprocess, pull-request code execution, or lifecycle-script execution; only the validated public package tree is installed in an owned temporary directory.
- [x] Human review approved wiring the collector into the privileged workflow.

- [x] [#293: Wire advisory provenance into trusted input](https://github.com/andrewpucci/andrewpucci.com/issues/293) — Retrieve the immutable lockfile and validate only the manifest `overrides` map, collect in parallel, and preserve the managed comment when evidence is unavailable. Depends on #292, #290, and #291; medium.

### Checkpoint: Provenance complete

- [x] Focused orchestration and comment-lifecycle tests pass.
- [x] `npm run lint`, `npm run check`, `npm test`, and `npm run build` pass.
- [x] The GitHub comment and dry-run output are unchanged until the separate `decision-reporting` module is approved.
- [x] Human review approved this incremental implementation plan.

### Phase 5: Complete decision coverage

The approved GitHub task records below implement [the decision-coverage specification](../SPEC-dependabot-decision-coverage.md) without changing CI gates or granting an
external research service any repository write capability.

```text
coverage input → decision-unit contract → comment + handoff → freshness + diagnostics → replay evaluation
```

- [x] [**Task 1: Collect path-aware decision coverage**](https://github.com/andrewpucci/andrewpucci.com/issues/294) — Read immutable
      base/head manifests and lockfiles, classify direct runtime roles, map internal
      lockfile paths conservatively, and collect bounded lifecycle-script deltas.
  - Acceptance: Every changed npm update is either uniquely grouped under a
    direct anchor or remains a standalone unresolved unit; duplicate package
    instances and missing metadata cannot be silently grouped.
  - Verify: Focused coverage/input tests cover roles, duplicate paths,
    ambiguous/orphan relationships, lifecycle additions/changes/unavailable
    metadata, and no checkout/installation of PR code.
  - Files: `inputs.mjs`, `coverage.mjs`, `inputs.test.ts`, `coverage.test.ts`.
  - Scope: Medium; no dependencies.

- [x] [**Task 2: Constrain the decision-unit verdict**](https://github.com/andrewpucci/andrewpucci.com/issues/298) — Add validated coverage
      units and the `decision_incomplete` verdict to the schema and bounded model
      batching/aggregation path.
  - Acceptance: `merge` requires a validated assessment for every coverage
    unit; `do_not_merge` wins over incomplete coverage; an explicit non-blocking
    follow-up is the only path to `merge_with_followups`.
  - Verify: Focused schema/batch tests prove verdict precedence, partial success,
    budget exhaustion, and that model output cannot omit or invent unit members.
  - Dependencies: Task 1.
  - Files: `schema.mjs`, `batches.mjs`, `schema.test.ts`, `batches.test.ts`.
  - Scope: Medium.

- [x] [**Task 3: Render decisions and one-way research handoffs**](https://github.com/andrewpucci/andrewpucci.com/issues/296) — Present
      decision queues, bounded provenance evidence, and deterministic copyable
      research briefs in the managed comment.
  - Acceptance: An incomplete review names its precise action and no opaque
    overflow; every handoff is head/digest-pinned, cites only vetted sources,
    and cannot be parsed back into workflow input.
  - Verify: Renderer/handoff tests cover every verdict, escaping, stale-head
    prompt data, source bounds, provenance states, comment limits, and unchanged
    marker/upsert semantics.
  - Dependencies: Task 2.
  - Files: `reporting.mjs`, `handoff.mjs`, `reporting.test.ts`, `handoff.test.ts`.
  - Scope: Medium.

- [x] [**Task 4: Bound reruns and emit safe diagnostics**](https://github.com/andrewpucci/andrewpucci.com/issues/297) — Key the expensive
      review to the PR/head/digest and expose only bounded run diagnostics.
  - Acceptance: A duplicate trigger for the same head does not repeat expensive
    analysis without explicit refresh; a new head invalidates the prior result;
    diagnostics contain no prompts, source excerpts, tokens, or credentials.
  - Verify: Focused orchestration tests prove idempotence/freshness and error
    handling while the existing comment lifecycle remains intact.
  - Dependencies: Tasks 2–3.
  - Files: `review.mjs`, `run.mjs`, `review.test.ts`, `run.test.ts`.
  - Scope: Medium.

- [x] [**Task 5: Replay decision evidence**](https://github.com/andrewpucci/andrewpucci.com/issues/295) — Add representative fixtures and
      run the revised dry run on PR 271 as the human-facing regression check.
  - Acceptance: Fixtures cover runtime roles, duplicate lockfile paths,
    lifecycle scripts, stale heads, every verdict, and the PR 271 decision queue.
  - Verify: Focused tests, `npm run lint`, `npm run check`, `npm test`,
    `npm run build`, and `npm run dependabot:review:dry-run -- 271` pass.
  - Dependencies: Tasks 1–4.
  - Files: `dry-run.test.ts`, `workflow.test.js`, focused review fixtures, and
    this plan/spec status.
  - Scope: Medium.

### Checkpoint: Decision coverage foundation

- [x] GitHub Issue tasks created and linked in this plan after approval.
- [x] Tasks 1–2 pass focused tests and retain the trusted workflow boundary.
- [x] Human review approved the managed-comment change before implementation.

### Checkpoint: Decision coverage complete

- [x] Tasks 3–5 pass focused tests, lint, checks, the full suite, and build.
- [x] PR 271 dry-run output tells the maintainer the exact decision/action for
      every unresolved unit.

### Phase 6: GitHub request guardrails

The approved [GitHub request-guardrails specification](../SPEC-dependabot-github-request-guardrails.md)
keeps large grouped reviews within the workflow's read-only GitHub API budget.
It preserves CI separation and the trusted workflow boundary.

- [ ] **Task 1: Skip duplicate immutable heads before packet loading**
  - Acceptance: A valid managed comment for the event head ends the runner
    before trusted input, upstream evidence, or Mistral work; explicit refresh
    and stale/malformed markers retain the normal path.
  - Verify: Focused freshness/runner tests.
  - Files: `freshness.mjs`, `run.mjs`, `freshness.test.ts`, `run.test.ts`.

- [ ] **Task 2: Govern and diagnose GitHub evidence requests**
  - Acceptance: Read-only `api.github.com` evidence calls share the approved
    two-concurrent, 160-request governor; 403/429 and budget exhaustion stop
    safely and emit bounded diagnostics without a retry.
  - Verify: Focused GitHub/input/review tests.
  - Files: `github.mjs`, `diagnostics.mjs`, `review.mjs`, focused tests.

- [ ] **Task 3: Select evidence by decision unit**
  - Acceptance: Direct-group anchors and standalones are the only upstream
    evidence targets; group-backed members remain bounded and rate-limited units
    become explicitly incomplete without disturbing other decisions.
  - Verify: Focused input/schema/policy/batch tests and replay when rate budget
    permits.
  - Files: `inputs.mjs`, `schema.mjs`, `policy.mjs`, `coverage.mjs`, focused
    tests.

PR 271 replay on immutable head `c0421579957fdc03c12f191d13c2b8a675aacc4c`
reduced 108 updates to 20 graph-backed decision units: 25 validated assessments
and 8 explicit queue entries. Each remaining entry names a direct group or
standalone update and a next action; the managed comment also offers a
digest-pinned, read-only research brief when it fits the GitHub comment limit.

- [ ] Review confirms no CI repetition, external-research ingestion, PR-code
      execution, new write permission, or secret exposure.

## Risks and Mitigations

| Risk                                                                    | Impact | Mitigation                                                                                               |
| ----------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------- |
| Upstream projects expose inconsistent tags and releases.                | High   | Use the explicit fallback ladder and record unavailable evidence rather than guessing.                   |
| Trusted context becomes overly broad or leaks sensitive content.        | High   | Use path allowlists, excerpt and aggregate limits, and negative tests for excluded files.                |
| A model produces convincing but unsupported prose.                      | High   | Validate every identifier/reference and enforce the deterministic policy ceiling after the response.     |
| Grouped Dependabot PRs exceed API or comment limits.                    | Medium | Paginate inputs, cap excerpts, and retain high-priority comment sections first.                          |
| Mistral truncates a grouped response or one package has large evidence. | High   | Project bounded evidence before batching, split only truncated batches, and preserve unaffected results. |
| Existing behavior regresses while schemas evolve.                       | Medium | Land vertical slices in the listed order with focused regression tests and checkpoints.                  |
| Registry or npm verification is slow or unavailable.                    | Medium | Use a 30-second hard timeout, isolated cache, and advisory `unavailable` fallback.                       |
| A future lockfile includes a private or non-registry source.            | High   | Reject it before the npm call; never transmit it to the public registry.                                 |
| Mutable runner tooling changes the verification result.                 | Medium | Explicitly provision and pin `npm@12.0.2` in the workflow.                                               |
| Lockfile paths are ambiguous or duplicated.                             | High   | Keep the update standalone and unresolved; never group from package-name similarity.                     |
| Lifecycle metadata cannot be safely matched.                            | High   | Mark only the affected decision unit incomplete and name the evidence gap.                               |
| An external research report is mistaken for trusted workflow input.     | High   | Render one-way briefs only; the workflow never parses or acts on external model prose.                   |
| A rebased PR makes earlier evidence stale.                              | High   | Bind coverage and handoffs to immutable head SHA plus digest; rerun on a new head.                       |
| Model/tool retries grow cost or duration.                               | Medium | Per-head coalescing, bounded source/model budgets, and scoped incomplete fallbacks.                      |

## Open Questions

None. The approved provenance specification defines the verifier runtime and
private-source boundary. The next gate is plan approval.
