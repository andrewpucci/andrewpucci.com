# Spec: `review-reporting`

## Objective

Render a validated `review-analysis` result as one clear, updatable advisory comment on its Dependabot pull request. The comment helps the maintainer decide whether to merge, understand useful package functionality, and act on blockers—especially official codemods—without turning the workflow into a merge authority.

The maintainer must be able to distinguish verified blockers from follow-ups, see the evidence links, and copy a remediation prompt when a plain Dependabot upgrade should not merge.

## Tech Stack

- GitHub Actions on GitHub-hosted Ubuntu runners.
- GitHub REST API with the workflow `GITHUB_TOKEN`.
- Node.js 24 with built-in `fetch`; no new runtime package is required.
- A single issue-style pull-request conversation comment, created or updated through the GitHub Issues comments API. Pull requests are issues for this API, which enables in-place updates and avoids an additional review notification for every Dependabot push.

The workflow requires `issues: write` only for this module. It does not need permission to approve, request changes, or merge a pull request.

## Commands

```sh
vp check
npm run check:svelte
npm run lint
npm test
npm run test:coverage
npm run test:ci
```

All reporting tests mock GitHub REST calls. They do not create or alter live pull-request comments.

## Project Structure

```text
.github/actions-scripts/dependabot-review/
  reporting.ts
    → Markdown rendering, comment discovery, and create/update operations.
  reporting.test.ts
    → Vitest coverage of rendering, truncation, idempotency, and failures.
  schema.ts
    → Shared input/analysis/reporting types and runtime validation.

.github/workflows/dependabot-intelligent-review.yml
  → Invokes the completed modules with minimal permissions.

SPEC-review-reporting.md
  → This module contract.
```

## Code Style

Use TypeScript, ESM imports, small pure render functions, and explicit REST response handling. Escape values that originate with model output or upstream documents before inserting them into Markdown. Render links only from previously validated official evidence URLs.

```ts
const marker = '<!-- dependabot-intelligent-review -->';

function commentBody(analysis: ReviewAnalysis, headSha: string): string {
  return `${marker}\n<!-- reviewed-head: ${headSha} -->\n${renderAnalysis(analysis)}`;
}
```

The body begins with a stable marker and the reviewed head SHA. On later updates, the module finds the marker on a comment authored by `github-actions[bot]` and updates it; otherwise it creates exactly one new comment.

## Reporting Contract

The rendered comment has these sections, in order:

1. **Verdict** — `Merge`, `Merge with follow-ups`, `Do not merge`, or `Analysis unavailable`; state plainly that it is advisory.
2. **What this update enables** — package-by-package features and `use now` / `consider later` / `not relevant` recommendations, each with an official source link.
3. **Reasons not to merge** — shown only for `do_not_merge`; each reason contains impact and cited evidence.
4. **Remediation plan** — ordered steps and validation commands for every blocker.
5. **Remediation prompt** — shown only for `do_not_merge`, in a copyable fenced text block.
6. **Review metadata** — package versions, reviewed head SHA, model result state, and a note that the action did not run code or codemods.

For `analysis_unavailable`, the comment states what failed at a high level, gives no merge recommendation, and directs the maintainer to perform a manual dependency review. It must not include raw provider responses, secrets, or untrusted document content.

The renderer caps the comment at 50,000 characters. If necessary, it preserves verdict, blockers, remediation, and the remediation prompt; it truncates lower-priority feature detail with an explicit notice. It never silently drops a blocker.

## Testing Strategy

Use Vitest for non-rendering logic, consistent with ADR-0010.

- Unit-test every verdict template and required section ordering.
- Unit-test that every `do_not_merge` comment contains reasons, evidence, remediation, validation, and a remediation prompt.
- Unit-test feature recommendations render only validated, official evidence links.
- Unit-test Markdown escaping for model and upstream text, including hostile headings, links, HTML, and fence delimiters.
- Unit-test comment discovery chooses only the marker-bearing comment created by `github-actions[bot]` for the same pull request.
- Unit-test creation on the first run and update on a new Dependabot head SHA; repeated input remains idempotent.
- Unit-test comment-size truncation preserves all blockers and the remediation prompt.
- Unit-test GitHub 403, 404, 422, and secondary-rate-limit responses without retry loops that duplicate comments.

## Boundaries

### Always

- Post only to the Dependabot pull request identified by the validated input packet.
- Create or update one marker-bearing comment authored by GitHub Actions.
- Make advice clearly advisory; deterministic Dependency Review and CI remain the actual merge gates.
- Include every verified blocker, its official evidence, remediation steps, validation commands, and remediation prompt.
- Include the head SHA so readers can tell whether the assessment is stale.
- Limit comment size and escape untrusted text before Markdown rendering.

### Ask First

- Using inline review comments or changing the comment format to a submitted PR review.
- Posting labels, assigning reviewers, changing status checks, or emitting annotations.
- Adding Slack/email notifications or any external communication.
- Changing the size cap, marker format, or retention behavior.

### Never

- Approve, request changes, merge, close, label, assign, or modify the Dependabot pull request beyond the single advisory comment.
- Post more than one active marker-bearing comment per pull request.
- Render secrets, raw Mistral replies, unvalidated URLs, or arbitrary upstream HTML.
- Claim the workflow ran a codemod, test suite, or remediation prompt.
- Convert an unavailable analysis into a favorable or unfavorable merge verdict.

## Success Criteria

1. A valid analysis produces one readable, advisory PR conversation comment with the required sections and reviewed head SHA.
2. Re-running the workflow for the same PR updates the existing marker-bearing comment instead of creating notification spam.
3. Every `do_not_merge` outcome visibly includes all reasons, cited evidence, remediation steps, validation commands, and a usable remediation prompt.
4. Feature usefulness recommendations appear with their supporting official sources.
5. Malformed/unavailable analysis produces a safe manual-review message and no merge recommendation.
6. The comment renderer prevents untrusted Markdown/HTML from changing the report's structure and respects the 50,000-character cap.
7. Offline Vitest tests cover creation, update, stale head SHA, truncation, API errors, and hostile content.

## Recorded Decision

Use an updatable issue-style pull-request conversation comment rather than a submitted PR review. GitHub's review endpoint creates notifications and submitted reviews cannot be deleted; a single updatable comment is more legible and less noisy for successive Dependabot updates.
