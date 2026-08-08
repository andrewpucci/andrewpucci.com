# Task List: KV-backed rate limiter for the contact form

Source: [tasks/plan.md](plan.md), [SPEC.md](../SPEC.md)

## Task 1: Implement `checkRateLimit` KV-backed fixed-window function with unit tests

**Description:** Create a `checkRateLimit(kv: KVNamespace, key: string): Promise<{ success: boolean }>` function that reads a JSON value (`{ count, windowStart }`) at `ratelimit:<key>`, starts a fresh window if missing or elapsed, otherwise increments, and writes back via `kv.put(..., { expirationTtl: WINDOW_SECONDS })` so stale entries self-clean. Cover the counting/window logic with unit tests against a mock `KVNamespace` before it's wired into anything live.

**Acceptance criteria:**

- [x] `checkRateLimit` allows up to 5 requests within a 60-second window and returns `{ success: true }` for each
- [x] The 6th request within the same window returns `{ success: false }`
- [x] After the window elapses, the counter resets and a new request returns `{ success: true }`

**Verification:**

- [x] Tests pass: `vp test run src/lib/server/rate-limiter.test.ts`
- [x] Build succeeds: `vp check`
- [x] Manual check: none — pure unit-level logic, no live wiring yet

**Dependencies:** None

**Files likely touched:**

- `src/lib/server/rate-limiter.ts` (new)
- `src/lib/server/rate-limiter.test.ts` (new)

**Estimated scope:** Small: 1-2 files

---

## Task 2: Bind a KV namespace in `wrangler.jsonc` and `app.d.ts`

**Description:** Register a KV namespace binding (`CONTACT_FORM_RATE_LIMITER`) in `wrangler.jsonc`. Update `src/app.d.ts`'s `Env` interface to replace the optional `CONTACT_FORM_RATE_LIMITER?: RateLimit` with `CONTACT_FORM_RATE_LIMITER: KVNamespace`, no longer optional — KV namespaces are supported on both Pages and Workers, unlike the old rate-limit binding. This is a `wrangler.jsonc` bindings change, which CLAUDE.md's Boundaries section flags for confirmation before editing — confirmation already given via approval of this plan (and re-confirmed after the DO hosting blocker was discovered).

**Acceptance criteria:**

- [x] `wrangler.jsonc` declares the `kv_namespaces` binding (no `migrations` block needed — that's DO-specific)
- [x] The stale top-of-file comment explaining why rate limiting is absent is removed or rewritten to reflect the new binding
- [x] `app.d.ts`'s `Env.CONTACT_FORM_RATE_LIMITER` type is replaced with `KVNamespace`, non-optional

**Verification:**

- [x] Build succeeds: `vp check`
- [x] Manual check: `vp run preview:pages` starts cleanly and the KV binding resolves (no "binding not found" error in Wrangler output)

**Dependencies:** Task 1

**Files likely touched:**

- `wrangler.jsonc`
- `src/app.d.ts`

**Estimated scope:** Small: 1-2 files

---

## Task 3: Call `checkRateLimit` from the contact form action, update its tests

**Description:** Replace the optional `env.CONTACT_FORM_RATE_LIMITER.limit()` call in `src/routes/contact/+page.server.ts` with a call to `checkRateLimit(env.CONTACT_FORM_RATE_LIMITER, ip)`, keyed by `getClientAddress()`. Implement fail-open behavior: if the KV call throws, log and let the submission proceed rather than blocking it. Update `page.server.test.ts` to mock a `KVNamespace` (`get`/`put`) instead of the old `RateLimit`-shaped mock, keeping the existing "too many requests → 429" and adding a "KV throws → request still succeeds" case for the fail-open path.

**Acceptance criteria:**

- [x] A 6th submission from the same IP within 60 seconds returns `fail(429, ...)` with the existing "Too many requests" message
- [x] A KV call that throws does not block the submission (fail-open) — this path is new and wasn't testable under the old dormant-binding code
- [x] No default exports, explicit return types, and comments only where they explain a non-obvious constraint, per SPEC.md §7

**Verification:**

- [x] Tests pass: `vp test run src/routes/contact/page.server.test.ts`
- [x] Build succeeds: `vp check` and `vp run check:svelte`
- [x] Manual check: `vp run preview:pages`, submit the form 6 times rapidly from the same browser, confirm the 6th shows the rate-limit error — verified via curl against the real local Wrangler runtime: requests 1-5 got 400 (no Turnstile token), request 6 got 429 "Too many requests. Try again in a minute."

**Dependencies:** Task 2

**Files likely touched:**

- `src/routes/contact/+page.server.ts`
- `src/routes/contact/page.server.test.ts`

**Estimated scope:** Small: 1-2 files

---

## Checkpoint: After Tasks 1-3

- [ ] All tests pass (`vp test`)
- [ ] `vp check` and `vp run check:svelte` both clean
- [ ] `vp run test:e2e` passes — confirms KV binds under Wrangler preview the same way it will in production
- [ ] Manual rapid-submission check from Task 3 done
- [ ] Review with human before proceeding to docs

---

## Task 4: Update README's "open ADR-0003 gap" section

**Description:** README currently has a section titled "Contact-form rate limiting (open ADR-0003 gap)" describing the missing binding and the three options considered. Rewrite it to describe what's actually implemented: the KV-backed limiter, its threshold, and why it was chosen (including the DO hosting blocker discovered along the way). Remove language that describes the gap as still open.

**Acceptance criteria:**

- [x] Section no longer says rate limiting is "not in place on Cloudflare Pages today"
- [x] Section states the actual threshold (5 requests / 60s per IP) and links to ADR-0003 for the decision rationale
- [x] No other README content is touched (scope discipline — this is a docs-only task)

**Verification:**

- [x] Build succeeds: `vp check` (markdown lint via `vp check --fix` if formatting drifts)
- [x] Manual check: read the rewritten section top to bottom, confirm it accurately reflects Tasks 1-3's implementation

**Dependencies:** Checkpoint after Tasks 1-3

**Files likely touched:**

- `README.md`

**Estimated scope:** XS: 1 file

---

## Task 5: Amend ADR-0003 recording the KV decision

**Description:** ADR-0003's "Contact form Worker" section states rate limiting is enforced in the Worker; its "Consequences" section notes "the contact form Worker needs rate limiting logic written explicitly." Add an amendment (following the existing `## Amendments` pattern already used twice in this ADR) recording: the DO approach that was tried and ruled out (adapter-cloudflare can't export a named DO class from its generated Worker), the KV approach chosen instead, why (Pages-compatible, no second deployable resource, avoids the WAF-rule's out-of-repo blind spot and the Workers migration's larger blast radius), the accepted eventual-consistency tradeoff, and the confirmed threshold. This amendment is required by issue #216's acceptance criteria, not optional.

**Acceptance criteria:**

- [x] New entry appended under ADR-0003's `## Amendments` heading, matching the existing amendment style (present-tense finding, then the resolution)
- [x] References all four alternatives considered (WAF rule, Durable Object, KV, Pages→Workers) and why KV won, consistent with SPEC.md §5 and issue #216's own framing
- [x] Does not rewrite or delete the ADR's original "Decision" section — amendments record what changed, not retroactive rewrites (matches the file's existing convention)

**Verification:**

- [x] Build succeeds: `vp check`
- [x] Manual check: re-read ADR-0003 end to end, confirm the amendment reads coherently alongside the two existing ones

**Dependencies:** Checkpoint after Tasks 1-3 (can run in parallel with Task 4 — both are docs-only, non-overlapping files)

**Files likely touched:**

- `docs/adr/0003-security-posture.md`

**Estimated scope:** XS: 1 file

---

## Checkpoint: Complete

- [ ] All acceptance criteria across Tasks 1-5 met
- [ ] `vp check`, `vp run check:svelte`, `vp test`, `vp run test:e2e` all pass
- [ ] Issue #216's Part 2 acceptance criterion satisfied: "A rate-limiting approach is chosen, implemented, and documented; ADR-0003 is amended"
- [ ] Ready to open a PR (draft, same pattern as #220) against `feat/sveltekit-migration`
