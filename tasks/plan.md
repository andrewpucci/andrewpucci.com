# Implementation Plan: KV-backed rate limiter for the contact form

Source: [SPEC.md](../SPEC.md) (Part 2 of [GitHub issue #216](https://github.com/andrewpucci/andrewpucci.com/issues/216))

## Overview

The contact form's server action (`src/routes/contact/+page.server.ts`) currently calls an optional `CONTACT_FORM_RATE_LIMITER` binding that is always `undefined` on Cloudflare Pages — Pages Functions don't support the native rate-limit binding. ADR-0003 requires Worker-level rate limiting independent of Resend's own limits, so this gap needs closing without changing the Pages deploy target. This plan implements a KV-backed fixed-window limiter (5 requests / 60s per IP), wires it into the existing action, and updates the docs (README, ADR-0003) that currently describe the gap as open.

## Architecture Decisions

- **KV, not a Durable Object.** The original design used a DO. Implementation revealed that's not actually hostable here: `@sveltejs/adapter-cloudflare`'s generated `_worker.js` only exports `default`, and Cloudflare requires a DO class to be exported by name from the script its binding points at. Hosting the DO would need either a second, independently deployed Worker (cross-script binding) or a Pages→Workers migration — both bigger than this gap calls for. KV needs no class hosting, just a data binding, so it fits the existing single-Pages-project architecture. Tradeoff accepted: KV is eventually consistent (writes can take up to ~60s to propagate), so a determined abuser distributed across edge locations could exceed the nominal limit by a small margin — acceptable for a contact form behind Turnstile, not a security boundary on its own.
- **Fixed window, 5 requests / 60s per IP**, confirmed with the user over the SPEC's suggested default (unchanged from the original design).
- **Fail-open on KV errors.** A thrown/rejected KV call lets the submission through rather than blocking legitimate users — rate limiting is defense-in-depth behind Turnstile, not the primary control.
- **Binding contract preserved.** `checkRateLimit(kv, key)` returns the same `{ success: boolean }` shape the dormant `RateLimit` binding had, so the call site in `+page.server.ts` changes minimally.

## Task List

### Phase 1: Foundation — the rate limit function itself

- [x] Task 1: Implement `checkRateLimit` KV-backed fixed-window function with unit tests

### Checkpoint: Foundation

- [x] `vp test run src/lib/server/rate-limiter.test.ts` passes
- [x] `vp check` passes
- [ ] Rate limit logic reviewed in isolation before it's wired into the live form

### Phase 2: Wire into the contact form

- [x] Task 2: Bind a KV namespace in `wrangler.jsonc` and `app.d.ts`
- [x] Task 3: Call `checkRateLimit` from the contact form action, update its tests

### Checkpoint: Integration

- [x] `vp check` passes
- [x] `vp test run src/routes/contact/page.server.test.ts` passes
- [x] KV binding confirmed live under `vp run preview:pages`: 6 rapid curl submissions returned 400×5 then 429, matching the fixed-window logic exactly
- [~] `vp run test:e2e` — `tests/e2e/contact.spec.js` fails locally (form never renders, `PUBLIC_TURNSTILE_SITE_KEY` missing from this machine's `.env`), but confirmed via `git stash` + rerun that this failure pre-exists on the Task-1-only commit too — not a regression from Tasks 2-3. Real E2E validation happens in CI, which sets that env var.
- [ ] Manual check: `vp run preview:pages`, submit the form 6 times rapidly, confirm the 6th is rejected with a 429 and its message

### Phase 3: Documentation

- [x] Task 4: Update README's "open ADR-0003 gap" section (the `wrangler.jsonc` top comment was already updated in Task 2's commit)
- [x] Task 5: Amend ADR-0003 recording the KV decision (and the DO dead end)

### Checkpoint: Complete

- [x] All SPEC.md §8 boundaries respected (`wrangler.jsonc` KV binding and namespace creation confirmed with the user before Task 2; no Pages→Workers migration attempted)
- [x] Issue #216's Part 2 acceptance criterion — "a rate-limiting approach is chosen, implemented, and documented; ADR-0003 is amended" — fully met
- [x] Ready for PR review

## Risks and Mitigations

| Risk                                                                                               | Impact | Mitigation                                                                                                                                                                                   |
| -------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| KV's eventual consistency lets a distributed abuser exceed the nominal limit                       | Low    | Documented as an accepted characteristic, not a defect; Turnstile remains the primary abuse control                                                                                          |
| Fixed-window counter allows a burst at window boundaries (e.g. 5 requests at 0:59, 5 more at 1:01) | Low    | Acceptable for a contact form behind Turnstile; documented as a known characteristic of fixed-window limiting, not a defect — sliding window would be over-engineering for this threat model |
| E2E tests become flaky if they accidentally trip the new rate limit                                | Medium | Confirm existing E2E contact-form tests submit fewer than 5 times per run; if not, adjust test setup rather than loosen the limiter                                                          |

## Open Questions

None outstanding — rate limit threshold (5 req/60s) confirmed with the user before this plan was written; KV vs. DO confirmed with the user after the DO hosting blocker was discovered during Task 2.
