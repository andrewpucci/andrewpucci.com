# Spec: Security-header and contact-form hardening

## Objective

Restore the intended security posture of `andrewpucci.com` without changing visitor-facing content or contact-form behavior.

The audit found that prerendered pages do not receive a Content Security Policy (CSP), while the dynamic `/contact/` response receives SvelteKit's CSP but not the shared HTTP-security headers. The contact form also accepts a successful Turnstile response without checking the configured widget action or hostname, and an obsolete copy of deployment configuration can mislead future changes.

Success means every deployed page has an appropriate security policy, the contact form only accepts tokens issued for this deployment and action, and there is exactly one canonical source of Pages routing/header configuration.

## Scope

### In scope

- Preserve SvelteKit's hash-based CSP for prerendered Pages responses and add the HTTP-only `frame-ancestors` directive in canonical root `_headers`.
- Apply the shared fixed HTTP-security headers to Worker-rendered responses, including `/contact/`, without overwriting SvelteKit's nonce-bearing CSP.
- Harden Turnstile validation by checking the expected action and configured hostname allowlist, bounding upstream verification time, and returning a safe form error for verification-service failures.
- Remove the stale `src/site/_headers` and `src/site/_redirects` copies.
- Add focused tests for headers/build output and all new Turnstile outcomes.
- Update the security ADR only where it no longer describes the shipped behavior.

### Out of scope

- Dependency upgrades, framework migrations, or changes to the production Cloudflare dashboard.
- Changing contact form fields, email delivery provider, rate-limit policy, or privacy policy.
- Replacing Cloudflare KV with a Durable Object.
- Performance experiments or unrelated refactoring.

## Tech stack

- SvelteKit 2 and Svelte 5, deployed through `@sveltejs/adapter-cloudflare` to Cloudflare Pages.
- TypeScript 6, Vite+ 0.2, Vitest 4, Playwright.
- Cloudflare Turnstile Siteverify and Resend, invoked from `src/routes/contact/+page.server.ts`.
- Cloudflare Pages static-header rules in root `_headers`; generated Worker responses for non-prerendered routes.

## Commands

```sh
# Static lint/format/type validation
npm run check
npm run check:svelte

# Unit, Storybook interaction, and coverage tests
npm run test:coverage

# Production Pages output
npm run build

# Cross-browser Pages-preview verification
npm run test:e2e

# Dependency advisory check
npm audit --audit-level=high
```

For manual header verification, run the generated Pages output and inspect both routes:

```sh
npx wrangler pages dev .svelte-kit/cloudflare --port 4175
curl -sS -D - -o /dev/null http://localhost:4175/
curl -sS -D - -o /dev/null http://localhost:4175/contact/
```

## Project structure

```text
_headers                              Canonical Pages static-response header rules
_redirects                            Canonical Pages redirect rules
svelte.config.js                      SvelteKit CSP configuration
src/routes/contact/+page.server.ts    Contact action, Turnstile, Resend
src/lib/server/rate-limiter.ts         Contact rate-limit helper
src/app.d.ts                           Typed Cloudflare runtime bindings
src/routes/contact/page.server.test.ts Contact action tests
src/lib/server/*.test.ts               Server utility tests
tests/e2e/                             Pages-preview and browser tests
docs/adr/0003-security-posture.md      Security rationale and operating posture
```

## Design and code style

- Use ESM imports, TypeScript, Svelte 5 runes, and the repository's Vite+ formatting/linting rules.
- Validate untrusted data at the server boundary. Treat Siteverify responses as untrusted until success, action, and hostname have all been checked.
- Keep the contact action's user-facing errors generic and log only non-sensitive operational context.
- Keep security policies explicit and allowlist-based. Fixed headers belong in one reusable server helper or hook, not repeated per route.
- Do not override SvelteKit's dynamic CSP header; merge or add only headers that are absent.

```ts
const isExpectedTurnstileResponse =
  result.success &&
  result.action === CONTACT_TURNSTILE_ACTION &&
  allowedHostnames.has(result.hostname ?? '');

if (!isExpectedTurnstileResponse) {
  return fail(400, { errors: formError('Verification failed. Please try again.'), values });
}
```

## Testing strategy

- Extend `src/routes/contact/page.server.test.ts` with cases for action mismatch, hostname mismatch, a Siteverify timeout/network failure, and a valid expected response.
- Add a server-level test for the fixed response-header helper/hook. It must verify that the helper does not replace an existing `Content-Security-Policy` header.
- Add a build-output or Pages-preview regression check proving:
  - `/` has the static CSP and shared fixed headers.
  - `/contact/` has SvelteKit's CSP plus the same fixed headers.
- Retain existing coverage thresholds: 80% lines, functions, branches, and statements.
- Run the command suite above; the cross-browser test run is the final runtime check.

## Boundaries

### Always

- Preserve SvelteKit's nonce/hash CSP behavior for dynamic responses.
- Keep the production Turnstile secret and Resend credentials out of code, test output, and logs.
- Validate `action` and hostname server-side for every accepted Turnstile token.
- Use a bounded Siteverify request and fail safely when it cannot be verified.
- Run static checks, coverage tests, a production build, E2E tests, and `npm audit` before handoff.

### Ask first

- Adding or changing Cloudflare dashboard bindings, hostnames, secrets, Turnstile widget configuration, CORS, or rate limits.
- Adding a dependency, changing the deployment platform, or altering CSP allowances beyond the existing Turnstile requirement.
- Changing CI configuration or security-header values that affect third-party integrations.

### Never

- Commit secrets or emit them in test fixtures/logs.
- Disable CSP, HSTS, clickjacking protection, or server-side Turnstile verification for convenience.
- Use a wildcard script source, `unsafe-eval`, or a client-only security check.
- Remove existing tests to make the change pass.

## Success criteria

1. Generated prerendered HTML contains SvelteKit's hash-based CSP, and canonical root `_headers` adds the HTTP-only `frame-ancestors 'none'` directive.
2. The static root route and dynamic `/contact/` route both send HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and clickjacking protection; `/contact/` retains a CSP compatible with Turnstile.
3. The contact action rejects a Siteverify response whose `action` is not `turnstile-spin-v2`, whose hostname is outside a configured allowlist, or whose verification request fails/times out.
4. A valid Siteverify result with the expected action and hostname still sends the contact email exactly once.
5. `src/site/_headers` and `src/site/_redirects` no longer exist; root `_headers` and `_redirects` are the documented canonical configuration.
6. All required checks pass with no new warnings or security advisories.

## Risks and mitigations

| Risk                                                   | Mitigation                                                                                                          |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Static CSP blocks a legitimate asset or Svelte runtime | Derive it from the existing SvelteKit policy, verify built output and Pages preview before shipping.                |
| Dynamic header logic overwrites nonce-bearing CSP      | Add only fixed headers and test preservation of an existing CSP.                                                    |
| Preview/local Turnstile tokens fail hostname checks    | Make allowed hostnames an explicit runtime configuration and use Cloudflare's documented test credentials in tests. |
| Siteverify outage disrupts submissions                 | Set a short timeout, return a generic retryable error, and log safe diagnostics.                                    |

## Open questions

None. The allowed Turnstile hostname list is a non-secret deployment value in
`wrangler.jsonc` (`andrewpucci.com` and the supported
`andrewpucci.pages.dev` branch-deployment hostname), rather than application
code.
