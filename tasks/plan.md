# Implementation Plan: Dependabot intelligent review improvements

## Overview

Implement the approved Dependabot-review improvements as seven small, dependency-ordered slices. The plan keeps GitHub CI outside the review comment and retains the existing trust boundary: the workflow runs only trusted default-branch code and never executes PR content, dependencies, or codemods.

Tasks are tracked in GitHub Issues, as required by the repository issue-tracker convention. The links below are the authoritative task records; this file is their dependency and checkpoint index.

## Architecture Decisions

- Gather evidence and trusted repository context independently, then combine them in a deterministic policy before invoking Mistral.
- Treat unavailable or partial evidence as a verdict constraint, not an instruction the model may override.
- Preserve the model as a bounded summarizer and classifier; source attribution, compatibility findings, and verdict ceilings remain validated program state.
- Render the managed comment from structured analysis, prioritizing decisions and actions over upstream release-note detail.

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
```

## Task List

### Phase 1: Complete the review packet

- [ ] [#274: Paginate PR files](https://github.com/andrewpucci/andrewpucci.com/issues/274) — Foundation for complete dependency extraction. No dependencies; small.
- [ ] [#276: Collect range-aware evidence](https://github.com/andrewpucci/andrewpucci.com/issues/276) — Fallback ladder and provenance/status fields. Depends on #274; medium.
- [ ] [#275: Add bounded trusted repository context](https://github.com/andrewpucci/andrewpucci.com/issues/275) — Allowlisted static context for package/action relevance. Depends on #274; medium.

### Checkpoint: Review packet

- [ ] Focused pagination, evidence, and context tests pass.
- [ ] `npm run lint` passes.
- [ ] Review packet contains only bounded, attributable upstream data and allowlisted trusted context.
- [ ] Human review before policy work.

### Phase 2: Constrain the recommendation

- [ ] [#279: Enforce deterministic review policy](https://github.com/andrewpucci/andrewpucci.com/issues/279) — Verdict ceilings and validated security/compatibility findings. Depends on #276 and #275; medium.
- [ ] [#277: Constrain Mistral analysis with policy and context](https://github.com/andrewpucci/andrewpucci.com/issues/277) — Validated model contract, bounded model-packet projection, adaptive batches, and deterministic aggregation. The batching foundation is policy-independent; policy verdict ceilings remain blocked on #279. Medium.

### Checkpoint: Decision integrity

- [ ] Focused policy, schema, and analysis tests pass.
- [ ] `npm run lint` passes.
- [ ] Fixtures prove missing evidence cannot yield `merge` and unsupported model citations are rejected.
- [ ] Human review before comment redesign.

### Phase 3: Present and wire the decision

- [ ] [#278: Render a scannable decision comment](https://github.com/andrewpucci/andrewpucci.com/issues/278) — Visible actionable groups, collapsed non-relevant detail, and evidence follow-ups. Depends on #277; small.
- [ ] [#280: Verify end-to-end workflow orchestration](https://github.com/andrewpucci/andrewpucci.com/issues/280) — Runner wiring and managed-comment lifecycle tests. Depends on #277 and #278; small.

### Checkpoint: Complete

- [ ] All focused tests and `npm run lint` pass.
- [ ] `npm test` passes.
- [ ] The workflow test fixture confirms no PR code is checked out or executed.
- [ ] Review against the five approved specs and capability map.

## Risks and Mitigations

| Risk                                                                    | Impact | Mitigation                                                                                               |
| ----------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------- |
| Upstream projects expose inconsistent tags and releases.                | High   | Use the explicit fallback ladder and record unavailable evidence rather than guessing.                   |
| Trusted context becomes overly broad or leaks sensitive content.        | High   | Use path allowlists, excerpt and aggregate limits, and negative tests for excluded files.                |
| A model produces convincing but unsupported prose.                      | High   | Validate every identifier/reference and enforce the deterministic policy ceiling after the response.     |
| Grouped Dependabot PRs exceed API or comment limits.                    | Medium | Paginate inputs, cap excerpts, and retain high-priority comment sections first.                          |
| Mistral truncates a grouped response or one package has large evidence. | High   | Project bounded evidence before batching, split only truncated batches, and preserve unaffected results. |
| Existing behavior regresses while schemas evolve.                       | Medium | Land vertical slices in the listed order with focused regression tests and checkpoints.                  |

## Open Questions

None. The approved specs define the initial source fallback ladder, policy thresholds, trusted-context boundary, and comment grouping behavior.
