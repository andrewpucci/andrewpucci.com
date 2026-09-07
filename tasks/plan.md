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
- Run provenance verification against an immutable PR lockfile in an isolated
  temporary directory after a script-free, public-registry-only install;
  unsupported sources and command failures become advisory-unavailable
  evidence, never a failed comment workflow.

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
- [ ] [#290: Collect advisory npm provenance evidence](https://github.com/andrewpucci/andrewpucci.com/issues/290) — Validate public npm lockfiles and collect bounded `verified`, `attention_required`, or `unavailable` evidence. No dependencies; small.
- [ ] [#291: Validate and isolate provenance input](https://github.com/andrewpucci/andrewpucci.com/issues/291) — Add the validated input contract while keeping provenance out of policy, the model packet, and the current comment. Depends on #290; medium.

### Checkpoint: Provenance foundation

- [ ] Focused verifier, collector, schema, and model-projection tests pass.
- [ ] `npm run lint`, `npm run check`, and `npm test` pass.
- [ ] Review confirms there is no private-source transmission, shell subprocess, pull-request code execution, or lifecycle-script execution; only the validated public package tree is installed in an owned temporary directory.
- [ ] Human review before wiring the collector into the privileged workflow.

- [ ] [#293: Wire advisory provenance into trusted input](https://github.com/andrewpucci/andrewpucci.com/issues/293) — Retrieve only the immutable lockfile, collect in parallel, and preserve the managed comment when evidence is unavailable. Depends on #292, #290, and #291; medium.

### Checkpoint: Provenance complete

- [ ] Focused orchestration and comment-lifecycle tests pass.
- [ ] `npm run lint`, `npm run check`, `npm test`, and `npm run build` pass.
- [ ] The GitHub comment and dry-run output are unchanged until the separate `decision-reporting` module is approved.
- [ ] Human review before starting the next module.

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

## Open Questions

None. The approved provenance specification defines the verifier runtime and
private-source boundary. The next gate is plan approval.
