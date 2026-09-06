# Spec: Dependabot review comment experience — 2026-09-06

## Objective

Render a Dependabot review that a maintainer can scan in seconds: the recommendation, evidence limitations, actionable improvements, and reasons to stop are visible without turning the comment into a release-note dump.

## Tech Stack

Node.js ESM Markdown rendering in `reporting.mjs` with source-adjacent Vitest tests. No client-side code, dependency, or external service is required.

## Commands

```sh
npm test -- .github/actions-scripts/dependabot-review/reporting.test.ts
npm run lint
npm test
```

## Project Structure

```text
.github/actions-scripts/dependabot-review/reporting.mjs      → deterministic Markdown renderer
.github/actions-scripts/dependabot-review/reporting.test.ts  → output and escaping tests
```

## Code Style

Render structured analysis through small formatting helpers and escape all text interpolated into Markdown.

```js
lines.push(`- **Use now:** ${escape(feature.feature)} — ${escape(feature.action)}`);
```

Preserve the managed-comment marker and reviewed head SHA.

## Requirements

1. Start with the advisory verdict and a one-sentence decision summary. Do not repeat GitHub CI status.
2. Show an **Evidence follow-ups** section whenever any package has partial or unavailable evidence, naming affected packages and the exact next review action.
3. Show a compact per-package summary: version range, dependency type, evidence status, and any policy result.
4. Group enabled functionality into visible **Use now** and **Consider later** sections. Every `Use now` item must show its concrete action and upstream source.
5. Put **Not relevant** items in a collapsed HTML `<details>` section, preserving their rationale and source without competing with the recommendation.
6. Render **Reasons not to merge** before functionality when the policy/model verdict is `do_not_merge`; preserve evidence, remediation, validation, and the remediation prompt.
7. Limit redundant features per package and safely cap the entire comment. If truncation is necessary, retain verdict, blockers, evidence status, and actions before lower-priority detail.
8. Preserve current managed-comment upsert semantics and escape text/fence delimiters so external content cannot break Markdown structure.

## Testing Strategy

Use renderer unit tests for all verdicts, evidence-follow-up output, each classification group, empty groups, details markup, action rendering, blockers, escaping, and priority-preserving truncation. Snapshot tests are unnecessary; use precise assertions on the Markdown contract.

## Boundaries

- Always: prioritize verdict, blockers, evidence status, and actionable items over descriptive release notes.
- Ask first: change the managed-comment identity, add reactions/reviews, or post additional comments.
- Never: present unavailable evidence as verified, show CI status, or execute/render external HTML beyond the controlled `<details>` structure.

## Success Criteria

- The top of every comment answers whether to merge and why.
- Missing evidence is visible without reading the package narrative.
- `Not relevant` items are present but collapsed.
- A maintainer can identify every concrete `Use now` action and its source from the visible comment.
- Renderer tests cover the classification-display regression fixed in the preceding change.

## Open Questions

None. The grouping and details behavior are approved scope decisions.
