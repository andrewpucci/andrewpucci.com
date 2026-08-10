# Security hardening tasks

- [x] Configure the `TURNSTILE_HOSTNAMES` Cloudflare Pages runtime binding with approved hostnames.
- [x] Task 1: Validate the complete Turnstile response contract.
  - Acceptance: Expected action and allowlisted hostname are required; timeouts/network failures fail safely; a valid response sends exactly one email.
  - Verify: `npm run test:coverage`
  - Files: `src/routes/contact/+page.server.ts`, `src/routes/contact/page.server.test.ts`, `src/app.d.ts`

- [x] Task 2: Add fixed headers to Worker responses without replacing CSP.
  - Acceptance: Dynamic responses receive all fixed headers, preserve CSP, status, body, and unrelated headers.
  - Verify: `npm run test:coverage`
  - Files: `src/lib/server/security-headers.ts`, `src/lib/server/security-headers.test.ts`, `src/hooks.server.ts`

- [x] Task 3: Make root deployment configuration canonical and CSP-complete.
  - Acceptance: Static CSP remains in SvelteKit's generated meta tag; root `_headers` adds HTTP-only `frame-ancestors`; stale `src/site` config is removed; ADR reflects static versus dynamic policy delivery.
  - Verify: `npm run check && npm run build && git diff --check`
  - Files: `_headers`, `src/site/_headers`, `src/site/_redirects`, `docs/adr/0003-security-posture.md`

- [x] Task 4: Verify headers through the generated Pages preview.
  - Acceptance: Static `/` and Worker `/contact/` responses assert the required header contracts without matching dynamic nonce values.
  - Verify: `npm run test:e2e`
  - Files: `tests/e2e/security-headers.spec.js`

- [ ] Final checkpoint: run all checks in `tasks/plan.md` and manually inspect Pages-preview headers.
