# Spec: Dependabot GitHub Request Guardrails — 2026-09-07

**Status:** Approved for implementation — 2026-09-07

## Objective

Keep the advisory Dependabot review within GitHub REST limits while preserving
decision integrity. A repeated event for an already reviewed immutable head
must not collect evidence again. A large grouped pull request must collect
upstream evidence by decision unit, not blindly by every lockfile update. When
the workflow reaches a local budget or GitHub returns a rate limit, it must
stop requesting GitHub data and make only the affected decision units
incomplete.

This is operational resilience, not a CI gate. It neither changes merge
permissions nor turns an incomplete advisory recommendation into a required
check.

## Tech stack

Node.js ESM action scripts, the existing read-only GitHub REST API,
GitHub Actions `GITHUB_TOKEN`, the separate GitHub App comment token, public
npm registry metadata, Mistral, and Vitest. No new dependency, permission,
secret, checkout, or external write is required.

GitHub documents a 1,000 request/hour/repository primary limit for
`GITHUB_TOKEN`, a 100-concurrent-request secondary limit, and stopping rather
than retrying immediately after a 403/429. The implementation follows those
constraints: [rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)
and [REST best practices](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api).

## Commands

```sh
npm test -- .github/actions-scripts/dependabot-review/github.test.ts \
  .github/actions-scripts/dependabot-review/inputs.test.ts \
  .github/actions-scripts/dependabot-review/review.test.ts \
  .github/actions-scripts/dependabot-review/run.test.ts
npm run lint
npm run check
npm test
npm run build

# No-write human regression check when GitHub's authenticated rate budget permits.
npm run dependabot:review:dry-run -- 271
```

## Project structure

```text
SPEC-dependabot-github-request-guardrails.md              this specification
.github/actions-scripts/dependabot-review/
  github.mjs                                              request governor and managed comments
  inputs.mjs                                              decision-unit-targeted upstream evidence
  review.mjs                                              guarded trusted packet loading
  freshness.mjs                                           immutable-head duplicate check
  diagnostics.mjs                                         bounded rate-limit diagnostics
  run.mjs                                                 no-write early skip and guarded orchestration
  *.test.ts                                               focused unit and orchestration coverage
```

## Code style

Use small ESM helpers with explicit limits and immutable identity keys. The
governor wraps `api.github.com` only; public npm registry reads remain outside
its request count. Treat all network responses as untrusted data. Keep response
headers out of comments and model packets; diagnostics may retain only the
bounded rate-limit fields below.

```js
if (state.stopped)
  throw new GithubRequestLimitError(state.limit);
```

## Requirements

### Early immutable-head skip

1. Resolve the pull-request number, read only the existing managed comment with
   the comment-app token, and compare its validated head/digest markers with
   `workflow_run.head_sha` before loading the review packet.
2. When that immutable head is already reviewed and
   `DEPENDABOT_REVIEW_REFRESH` is not `true`, emit a duplicate-review diagnostic
   and stop. Do not retrieve PR files, immutable manifests/lockfiles, upstream
   sources, npm metadata, provenance, or invoke Mistral.
3. If the event has no usable immutable head, the managed comment is missing or
   malformed, the head differs, or an explicit refresh is present, retain the
   existing full review path. A current event with an obsolete head may safely
   skip because the newer head will receive its own completed-CI event.
4. Preserve deletion behavior only when a review packet is successfully loaded
   and contains no reviewable Dependabot update. A request-limit failure before
   packet creation must leave the existing managed comment untouched.

### GitHub request governor

1. Wrap every `api.github.com` request made while loading the trusted review
   packet in one shared governor. Do not govern npm registry requests or use the
   comment-app token for source-evidence collection.
2. Set `maxConcurrency` to **2** and `maxRequests` to **160** per review run.
   Count only requests actually dispatched to `api.github.com`; queued or
   rejected requests do not consume budget.
3. Deduplicate in-flight and completed safe `GET` JSON lookups by their full
   URL and authorization scope within a run. Do not cache or reuse mutable
   upstream evidence across a new workflow run or immutable PR head.
4. On 403 or 429, record `status`, `resource`, `remaining`, `reset`, and
   `retryAfter` when supplied; stop dispatching further GitHub requests. Never
   sleep or retry in the same run. A local 160-request exhaustion follows the
   same stop path with `status: request_budget_exhausted`.
5. Never log authorization headers, response bodies, prompt text, source
   excerpts, tokens, or credentials. A rate-limit diagnostic may include only
   the bounded fields in requirement 4 and, when available, immutable review
   metadata already permitted by the current diagnostic contract.

### Decision-unit evidence

1. Collect immutable npm coverage before selecting upstream evidence targets.
   For each direct coverage group, the direct anchor is its one evidence target;
   every standalone update is its own target. GitHub Actions updates without npm
   coverage remain standalone targets.
2. Fetch npm metadata and GitHub release/compare evidence only for evidence
   targets. A grouped member is represented as `group_backed`: it has no
   invented individual upstream source, relies only on its validated direct
   anchor and lockfile relationship for decision-unit scope, and cannot create a
   new-functionality recommendation without a cited source.
3. The deterministic policy must treat `group_backed` members as covered by
   their group anchor rather than manufacture a per-member missing-evidence
   follow-up. If an anchor has partial or unavailable evidence, that anchor's
   policy restriction still constrains the entire decision.
4. If the governor stops while gathering an evidence target, mark that target's
   coverage item and every member of its direct group unresolved with a precise
   `github_rate_limited` or `github_request_budget_exhausted` reason. Retain
   assessments and evidence for unaffected units. The result is
   `decision_incomplete` unless an independent `do_not_merge` finding wins.
5. If the initial PR/files/immutable-input request is rate limited before a
   packet exists, publish no new comment and record a bounded run-level
   diagnostic. Do not delete or overwrite the prior comment.

## Testing strategy

Use mocked fetches only. The suite must prove:

1. A same-head valid managed comment skips packet loading before any evidence or
   model call; explicit refresh and stale/malformed markers do not skip.
2. The governor dispatches at most two GitHub requests concurrently, dispatches
   at most 160 requests, deduplicates a repeated GET, and never governs an npm
   registry URL.
3. A 403/429 stops subsequent GitHub requests, exposes only bounded rate data,
   and does not retry. A pre-packet limit preserves the existing comment.
4. A direct group fetches evidence for its anchor once rather than every member;
   standalone/action updates remain targets; group-backed members cannot produce
   unsupported new-functionality output.
5. A stopped target makes only its decision unit unresolved, preserves other
   assessments, and yields `decision_incomplete` rather than an advisory merge.
6. Existing pagination, trusted-context, managed-comment, digest, no-PR-code,
   and no-external-research-ingestion tests remain valid.

## Boundaries

### Always

- Stop further GitHub requests on rate limits or local budget exhaustion.
- Preserve immutable-head, digest, trusted-checkout, and managed-comment rules.
- Prefer an explicit incomplete decision unit to guessed or silently omitted
  evidence.
- Keep request limits and diagnostics deterministic and unit tested.

### Ask first

- Change the 160-request or two-concurrent-request limit.
- Change workflow timeout, trigger, permissions, token scope, or comment owner.
- Add a cache, artifact, service, dependency, secret, automatic retry, or new
  external evidence provider.

### Never

- Retry a rate-limited GitHub request in the same run.
- Hide a limit-induced evidence gap behind a normal merge recommendation.
- Treat a grouped member as individually researched or copy the anchor's source
  to it.
- Emit credentials, request URLs containing secrets, response bodies, source
  excerpts, model output, or CI status in diagnostics or comments.

## Success criteria

1. Duplicate workflow events for an immutable reviewed head consume no
   evidence-collection or model budget.
2. The workflow cannot issue more than two concurrent or 160 total GitHub
   evidence requests per run, and it stops safely after 403/429.
3. PR 271-style grouped updates collect upstream evidence once per decision
   unit, while standalone updates remain independently evidenced.
4. A request limit produces an actionable incomplete decision only for affected
   units, preserves other conclusions, and leaves an existing comment unchanged
   when no packet can be formed.
5. Focused tests, lint, static checks, the full suite, and build pass without
   changing CI gates, workflow permissions, or trusted-boundary guarantees.

## Open questions

None. The approved initial limits are intentionally conservative; changing them
requires a separate review of observed diagnostics and workflow duration.
