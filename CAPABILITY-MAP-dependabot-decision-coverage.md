# Capability Map: Dependabot Decision Coverage — 2026-09-07

**Status:** Approved for implementation — 2026-09-07

**Decision:** A Dependabot review must represent the coverage of every changed
dependency honestly. It may consolidate updates into evidence-backed review
groups, but it must not call an unresearched group safe or emit a normal merge
recommendation while a decision-relevant update is unaccounted for.

| Module id                | Responsibility                                                                                                                           | Depends on                                                  |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `coverage-groups`        | Deterministically account for every update, including manifest role, lockfile path, dependency relationship, and lifecycle-script delta. | Existing validated review packet                            |
| `verdict-constraint`     | Convert incomplete coverage into an explicit advisory verdict constraint without changing CI, branch protection, or merge permissions.   | `coverage-groups`                                           |
| `comment-wayfinding`     | Put the maintainer's next action first and show the reasoning/group membership without a lockfile dump.                                  | `verdict-constraint`                                        |
| `research-handoff`       | Render a head-pinned, read-only external-research brief; never re-ingest another model's prose.                                          | `comment-wayfinding`                                        |
| `evaluation-diagnostics` | Replay deterministic decision cases and expose bounded, non-sensitive run diagnostics.                                                   | `coverage-groups`, `verdict-constraint`, `research-handoff` |

Build order: `coverage-groups` → `verdict-constraint` → `comment-wayfinding` →
`research-handoff`; `evaluation-diagnostics` follows the completed contracts.

## Scope boundaries

- This is advisory decision support. It does not repeat CI results, create a
  required check, alter Dependabot's pull-request grouping, or execute
  pull-request code.
- Grouping reduces the number of units a maintainer considers; it is not an
  automatic approval rule. A group is only considered covered when the review
  can name the evidence or the exact deterministic relationship that accounts
  for every member.
- A package that is neither researched nor a member of an explained group is
  unresolved. The review must say so plainly and name the next action.
- An external-research report remains advisory to the human reviewer. The
  workflow must never parse it as trusted input or alter a GitHub decision from
  it.
