# Spec: Dependabot analysis contract and bounded execution — 2026-09-06

## Objective

Constrain Mistral to summarize vetted evidence, repository context, and deterministic policy results into useful classifications without inventing sources, findings, or stronger verdicts. The reviewer must also complete grouped Dependabot updates without letting one oversized model completion discard otherwise valid package assessments.

The primary reader is the maintainer deciding whether to merge a grouped dependency update. They need one managed comment with a trustworthy overall recommendation, package-level follow-ups, and a clear indication when a package could not be analyzed.

## Tech Stack

Mistral chat-completions API, Node.js ESM, `analysis.mjs`, `inputs.mjs`, and schema validation in `schema.mjs`. The existing model, JSON-object response format, timeout, and graceful fallback remain in place unless separately changed. No dependency, second model, or persistence layer is required.

## Commands

```sh
vp test run .github/actions-scripts/dependabot-review/analysis.test.ts .github/actions-scripts/dependabot-review/schema.test.ts
vp lint . && vp fmt --check
vp test run
```

## Project Structure

```text
.github/actions-scripts/dependabot-review/analysis.mjs      → model request and unavailable fallback
.github/actions-scripts/dependabot-review/inputs.mjs        → trusted evidence packet and bounded model projection
.github/actions-scripts/dependabot-review/schema.mjs        → input/output contract validation
.github/actions-scripts/dependabot-review/analysis.test.ts  → request and fallback tests
.github/actions-scripts/dependabot-review/schema.test.ts    → output validation tests
.github/actions-scripts/dependabot-review/run.mjs           → batch orchestration and managed-comment handoff
```

## Code Style

Keep the contract explicit and validate every model-controlled reference against vetted input.

```js
if (analysis.verdict === 'merge' && policy.maximumVerdict !== 'merge')
  throw new TypeError('verdict exceeds policy');
```

Treat model responses and all supplied evidence as untrusted data. Keep batch helpers pure, name limits explicitly, and merge only parsed, validated outputs.

```js
for (const batch of batches) {
  const result = await analyze(batch, apiKey);
  results.push(result.verdict === 'analysis_unavailable' ? splitOrRecord(batch) : result);
}
```

## Requirements

1. Collect and validate the complete trusted review packet before making a model-specific projection. The projection may shorten excerpts but must not mutate evidence status, source URLs, findings, package identity, or policy results.
2. Cap each projected source excerpt, each projected package, and the entire serialized batch packet with named, tested constants. When a source must be shortened, retain its URL, title, range, and a clear `excerptTruncated` signal; it remains attributable but cannot be presented as complete text.
3. Analyze a grouped update as an ordered sequence of bounded package batches. Preserve input order and retain a stable package identity of `name`, `from`, and `to` throughout projection, partitioning, and aggregation.
4. Each initial batch must obey named, tested package-count and serialized-packet-size limits. Its contract requests one concise assessment per input package, no more than one enabled-functionality item per package, and no release-note restatement.
5. Launch independent initial batches with bounded concurrency. Reserve time for aggregation and comment publication inside the existing five-minute workflow; per-request timeouts must not extend past that shared deadline.
6. A batch response may discuss only packages included in that batch. Validate all references against the projected batch packet before retaining it.
7. If Mistral reports `finish_reason: "length"`, retry only that batch after splitting it into two smaller, non-empty batches. Continue until the response validates or the batch contains exactly one package.
8. Do not retry a batch for malformed JSON, schema violations, transport errors, HTTP failures, or timeout. Record that batch as unavailable immediately; retrying malformed model output would be nondeterministic and can exhaust the workflow budget.
9. A one-package batch that is truncated is unavailable for that package. Preserve successful results for every other package and identify the unavailable package and its manual-review need in the aggregate result.
10. Produce the PR-level verdict deterministically from all retained package results, using strict precedence: `do_not_merge` > `merge_with_followups` > `merge`. Any unavailable or unattempted package caps the aggregate verdict at `merge_with_followups`; it must not erase an independent `do_not_merge` result.
11. Produce the PR-level summary deterministically from retained package outcomes and unavailable-package records. It must name every reviewed package exactly once, state whether its analysis is complete or unavailable, and must not require a final Mistral aggregation call.
12. Permit `use_now` only when a feature has both an upstream source and a repository-context fact that supports a concrete next action. Otherwise require `consider_later` or `not_relevant`.
13. Require a concrete action for `use_now`; generic upstream enhancements are not sufficient.
14. Permit only source URLs, paths, and finding IDs present in the validated projected packet. Reject unknown references, unsupported classifications, duplicate package assessments, omitted package assessments, and a verdict less restrictive than policy permits.
15. Preserve the current `analysis_unavailable` fallback for a PR where no package result validates. It must recommend manual review without exposing secrets, raw model output, request bodies, or responses.
16. Bound cumulative requests and wall-clock time. Stop launching new requests when the configured request budget or shared deadline cannot accommodate them, then record all unattempted packages as unavailable rather than allowing the workflow to time out.

## Testing Strategy

Mock Mistral responses. Verify packet fields, policy verdict enforcement, supported evidence references, `use_now` action/context requirements, invalid-output fallback, and no raw model output in logs/comments.

Add focused tests for:

- bounded model-packet projection, including source/package/batch limits and an explicit truncation signal;
- deterministic partitioning at package-count and serialized-size boundaries;
- a successful multi-batch review with complete package coverage and input-order preservation;
- bounded-concurrency scheduling and request timeouts clipped to the shared workflow deadline;
- recursive split-and-retry for a length-truncated multi-package batch;
- a length-truncated single-package batch that yields an aggregate `merge_with_followups` result while retaining other valid assessments;
- malformed, timeout, and HTTP-error batches that do not retry;
- verdict precedence across batch results, including an unavailable package plus a verified blocker;
- duplicate, omitted, and cross-batch package assessments rejected before aggregation; and
- request-count and deadline exhaustion that records unattempted packages without leaking model output.

## Boundaries

- Always: keep response validation stricter than prompt instructions; project only bounded trusted input; use deterministic policy as the verdict ceiling; preserve valid results from unaffected batches; and make unavailable packages explicit.
- Ask first: change models, increase the workflow timeout, increase the request or concurrency budget, send new categories of repository context, or relax the evidence-reference constraint.
- Never: execute model-suggested commands; use model text as evidence; make a second unbounded model call to merge results; send an unbounded evidence excerpt; or silently omit a package after a batch failure.

## Success Criteria

- A grouped PR with 18 package updates no longer becomes wholly unavailable merely because one response exceeds the completion limit.
- A package with several large evidence excerpts still produces a bounded, attributable model packet before it enters a batch.
- Every input package appears exactly once in the aggregate outcome as complete, unavailable, or unattempted due to the configured workflow budget.
- A truncated multi-package response is retried only as smaller batches; a truncated one-package response is marked unavailable without another retry.
- A `use_now` classification without a trusted-context basis is rejected.
- A model cannot turn a policy-capped `merge_with_followups` result into `merge`.
- Every displayed claim links to a vetted upstream source or is clearly labeled as repository context.
- No aggregate result can hide a verified `do_not_merge` blocker behind a batch fallback.
- All invalid model responses degrade to a scoped manual-review path without exposing raw model output.

## Open Questions

None. Initial packet, batch, concurrency, and request-budget constants will be selected from the existing 4,096-token completion limit and five-minute workflow deadline, then locked down by boundary tests; changing them later is a reviewed configuration change.
