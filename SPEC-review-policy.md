# Spec: Dependabot review policy — 2026-09-06

## Objective

Apply deterministic, evidence-based constraints before the model writes an advisory verdict. This prevents a fluent summary from upgrading incomplete evidence or known risk into an unqualified merge recommendation.

## Tech Stack

Node.js ESM, the validated evidence/context packet, and the existing review schema. No external provider or new package is required.

## Commands

```sh
npm test -- .github/actions-scripts/dependabot-review/schema.test.ts .github/actions-scripts/dependabot-review/analysis.test.ts
npm run lint
npm test
```

## Project Structure

```text
.github/actions-scripts/dependabot-review/policy.mjs        → deterministic policy evaluation
.github/actions-scripts/dependabot-review/policy.test.ts    → policy fixtures and precedence tests
.github/actions-scripts/dependabot-review/schema.mjs        → policy result validation
```

## Code Style

Express decisions as ordered, inspectable rules rather than hidden prompt wording.

```js
if (dependency.evidence.status === 'unavailable')
  return followUp('Upstream evidence is unavailable.');
```

Use immutable result objects, stable finding IDs, and explicit verdict precedence.

## Requirements

1. Evaluate every dependency before Mistral analysis and produce verified findings plus a maximum permissive verdict.
2. Missing or partial required upgrade evidence always caps the outcome at `merge_with_followups`; a model may recommend a stricter result but never `merge`.
3. Treat a verified unresolved vulnerability affecting the proposed version as follows: critical/high → `do_not_merge`; moderate/low or unscored → `merge_with_followups`. Findings must contain the advisory URL, severity when available, affected range/status when available, remediation, and validation steps.
4. Produce a `merge_with_followups` finding for verified compatibility uncertainty, including runtime/engine mismatch, incompatible peer requirement, deprecated workflow input, or a range-proven migration/codemod. Escalate to `do_not_merge` only when supplied evidence proves that the current trusted context is incompatible.
5. Merge package results using strict precedence: `do_not_merge` > `merge_with_followups` > `merge`.
6. Keep license metadata informational; no license may change a verdict until an explicit repository license policy is approved.
7. Give the model only policy findings that are validated against supplied source/context URLs. The model cannot invent a blocker or remove a policy finding.

## Testing Strategy

Use table-driven unit tests for verdict precedence, missing evidence, each vulnerability severity, unscored advisories, compatibility uncertainty, proven incompatibility, codemods, and informational licenses. Add schema tests rejecting unverifiable policy findings.

## Boundaries

- Always: make verdict constraints deterministic and source-backed.
- Ask first: change risk thresholds, introduce license enforcement, or make a policy rule authoritative outside this workflow.
- Never: allow model prose alone to produce a risk finding or an unqualified `merge` when policy caps it.

## Success Criteria

- No packet with unavailable evidence can render an advisory `merge`.
- A critical/high vulnerability affecting the proposed version produces `do_not_merge` with attributable evidence.
- Unverified compatibility concerns remain follow-ups, not blockers.
- Every policy rule has a focused regression test.

## Open Questions

None. Severity thresholds and license non-enforcement are approved scope decisions.
