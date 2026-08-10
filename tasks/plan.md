# Implementation Plan: Security-header and contact-form hardening

## Overview

Implement the approved security-hardening spec in four small, sequential slices. The work restores CSP coverage for static Pages assets, gives Worker-rendered routes the same fixed security headers, validates the full Turnstile response contract, and removes stale configuration that could cause future policy drift.

## Prerequisite

Before Task 1 is deployed, the repository owner must add the `TURNSTILE_HOSTNAMES` runtime binding in Cloudflare Pages. It must be a comma-separated allowlist of intended hostnames, beginning with `andrewpucci.com`; preview/local hostnames belong there only when their widgets are intentionally supported. This is a deployment-configuration change and is not performed by this implementation plan.

## Dependency graph

```text
Runtime hostname binding
        |
        v
Task 1: Turnstile response contract and tests
        |
        v
Task 2: Worker fixed-header helper and hook
        |
        +-------------------+
        v                   v
Task 3: Static CSP + remove stale config
        |                   |
        +---------+---------+
                  v
       Task 4: Pages-preview header regression test
                  |
                  v
            Final verification
```

Tasks 1–3 are deliberately sequential because they establish the runtime contract and header policy that Task 4 verifies end-to-end. No application-code work is safely parallelizable without first agreeing on those contracts.

## Architecture decisions

- Use `TURNSTILE_HOSTNAMES` as an explicit, comma-separated runtime allowlist. Do not infer trust from a request host or hardcode production/preview domains.
- Add a short abort timeout to Siteverify and fail closed with the existing generic verification message when the upstream cannot be verified.
- Implement fixed Worker headers in a reusable `src/lib/server` helper invoked by `src/hooks.server.ts`. The helper must never set `Content-Security-Policy`, allowing SvelteKit to retain its per-response nonce-bearing CSP.
- Place the static CSP in canonical root `_headers`; it protects prerendered assets that bypass the Worker hook.
- Use one E2E request-level test against the generated Pages preview to verify the actual static and dynamic response contracts.

## Task list

### Phase 1: Contact boundary hardening

- [ ] Task 1: Validate the complete Turnstile response contract

  - Acceptance:
    - A token is accepted only when Siteverify reports `success: true`, action `turnstile-spin-v2`, and a hostname in `TURNSTILE_HOSTNAMES`.
    - A missing/invalid hostname configuration, mismatch, timeout, or network failure returns the existing safe verification error and never calls Resend.
    - A valid expected response still sends one email.
  - Verify: `npm run test:coverage`
  - Dependencies: Deployment prerequisite
  - Files: `src/routes/contact/+page.server.ts`, `src/routes/contact/page.server.test.ts`, `src/app.d.ts`
  - Estimated scope: M

### Checkpoint: Contact boundary

- [ ] Focused contact tests pass with the new rejection and success cases.
- [ ] No secret, token, or full email body is added to logs or fixtures.

### Phase 2: Header coverage

- [ ] Task 2: Add fixed headers to Worker responses without replacing CSP

  - Acceptance:
    - Worker responses include HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy` values matching canonical static policy.
    - An existing `Content-Security-Policy` is unchanged.
    - The hook does not change status, body, or existing non-security headers.
  - Verify: `npm run test:coverage`
  - Dependencies: Task 1
  - Files: `src/lib/server/security-headers.ts`, `src/lib/server/security-headers.test.ts`, `src/hooks.server.ts`
  - Estimated scope: M

- [ ] Task 3: Make root deployment configuration canonical and CSP-complete

  - Acceptance:
    - Root `_headers` supplies the static CSP and existing fixed headers using the same documented policy shape as SvelteKit where applicable.
    - `src/site/_headers` and `src/site/_redirects` are removed.
    - ADR-0003 describes the two delivery paths accurately: static `_headers` and dynamic hook/SvelteKit CSP.
  - Verify: `npm run check && npm run build && git diff --check`
  - Dependencies: Task 2
  - Files: `_headers`, `src/site/_headers` (delete), `src/site/_redirects` (delete), `docs/adr/0003-security-posture.md`
  - Estimated scope: M

### Checkpoint: Header coverage

- [ ] A production build completes and generated Pages output still contains canonical `_headers`.
- [ ] Static and dynamic policy responsibilities are documented without contradictory source files.

### Phase 3: Runtime regression proof

- [ ] Task 4: Verify static and Worker response headers in the Pages preview

  - Acceptance:
    - The root static route returns CSP plus all fixed security headers.
    - `/contact/` returns SvelteKit CSP plus all fixed security headers.
    - The test asserts header presence/required directives rather than brittle nonce values or full header strings.
  - Verify: `npm run test:e2e`
  - Dependencies: Tasks 1–3
  - Files: `tests/e2e/security-headers.spec.js`
  - Estimated scope: S

### Final checkpoint

- [ ] `npm run check`
- [ ] `npm run check:svelte`
- [ ] `npm run test:coverage`
- [ ] `npm run build`
- [ ] `npm run test:e2e`
- [ ] `npm audit --audit-level=high`
- [ ] Manual Pages-preview inspection of `/` and `/contact/` confirms the expected headers.
- [ ] All success criteria in [the specification](../docs/specs/2026-08-security-hardening.md) are met.

## Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| CSP blocks an asset or runtime behavior | High | Build first, then assert response headers and run the full Pages-preview E2E suite. |
| Dynamic hook overwrites SvelteKit nonce CSP | High | Keep CSP out of the fixed-header helper and unit-test preservation explicitly. |
| Hostname allowlist excludes a legitimate deployment | Medium | Make the Cloudflare binding explicit and document preview-host requirements before deployment. |
| Siteverify transient failure harms contact conversion | Medium | Use a bounded timeout and a retryable, generic form error; retain safe operational logging. |

## Open questions

None for code design. Deployment approval is required only for the `TURNSTILE_HOSTNAMES` binding described in the prerequisite.
