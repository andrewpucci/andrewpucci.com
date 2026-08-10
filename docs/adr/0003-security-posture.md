# ADR-0003: Security posture

Date: 2026-06-29
Status: Accepted

## Context

Andrew works in information security. A personal portfolio with weak security hygiene would be a credibility problem for someone in that role. The target audience includes security-aware hiring managers at enterprise tech companies who will notice things like missing security headers or permissive CSP directives.

The site is also a demonstration of craft. The same discipline applied to accessibility and token architecture applies here.

## Decision

### HTTP security headers

Prerendered Pages responses receive fixed headers and an HTTP `frame-ancestors` policy from root `_headers`; SvelteKit emits their hash-based CSP in a meta tag. Worker-rendered responses receive the same fixed headers from `src/hooks.server.ts`; the hook intentionally leaves CSP to SvelteKit so it can emit the per-response nonce/hash policy. This split is necessary because Cloudflare Pages does not apply `_headers` rules to Function responses.

- `Content-Security-Policy` — static responses receive SvelteKit's hash-based meta CSP, supplemented by `_headers` with the HTTP-only `frame-ancestors` directive. Worker responses receive SvelteKit's CSP. `script-src` has no `unsafe-inline` or `unsafe-eval`, and external sources are allowlisted explicitly and minimally. `style-src 'unsafe-inline'` is the documented narrow exception required for Svelte runtime style mutations.
- `Strict-Transport-Security` — long `max-age`, `includeSubDomains`.
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` — camera, microphone, geolocation, and payment denied by default.

### Supply chain

- `package-lock.json` is committed and CI uses `npm ci`, not `npm install`.
- `npm audit` runs in CI and fails on high or critical severity findings. Moderate and low findings are reviewed manually.
- Before adding a new dependency, its project health is evaluated using OpenSSF Scorecard (`scorecard.dev`). Scorecard checks branch protection, signed releases, active maintenance, dependency update tooling, and CI presence, and returns a numeric score. This is the adoption-decision gate. Scores are not committed to the repo — they decay as upstream projects evolve, and the live API is always more accurate. If a low-scoring package is accepted anyway, the rationale is documented as an amendment to this ADR, not as a score file.
- The `ossf/scorecard-action` GitHub Action runs on a schedule and uploads results to GitHub's Security tab as SARIF. This surfaces drift in existing dependencies without requiring committed artifacts.
- The Socket GitHub App runs on every PR that touches `package.json`. It clones the registry in real time and flags new install scripts, outbound network requests, environment variable access, and obfuscated code within seconds of publication. This catches supply chain attacks that haven't yet made it into CVE databases. Socket is free for public repositories.
- Third-party runtime dependencies are kept minimal. Replacing Bootstrap and FontAwesome SVG+JS with bespoke CSS and inline SVG removes two external runtime code sources that would otherwise require CSP allowlist entries and introduce supply chain risk.
- No third-party analytics, tracking pixels, or session recording scripts. If analytics are added later, the choice must be documented here and the CSP updated accordingly.

### Accepted Scorecard exceptions

- **MDsvex** (`pngwn/mdsvex`) scored 3.1, with a Maintained score of 0. The project isn't actually abandoned — the last commit predates this check by about a week — but Scorecard's maintenance check measures commit/issue velocity, which a small, stable preprocessor doesn't need. Accepted because it's a build-time-only dependency: a compromised version affects the build machine and CI runner, not site visitors. Socket's PR-time scanning is the mitigating control. It's also the only tool that lets Svelte components render inside Markdown, which is why ADR-0009 chose it. See ADR-0009.
- **Terrazzo** (`terrazzoapp/terrazzo`) scored 5.3. Maintained: 10 and every critical check (Dangerous-Workflow, License, CI-Tests, Code-Review) passes; the gaps are process hygiene (no security policy, unpinned CI dependencies, no token-permissions restrictions) typical of a smaller, newer project. Accepted because it's the only Vite-native DTCG build tool, which is why ADR-0006 chose it. See ADR-0006.

### Contact form Worker

- Bot protection runs server-side in the Worker before any processing occurs. Submitting to the form endpoint directly, bypassing the client-side form, doesn't bypass the protection.
- Rate limiting is enforced in the Worker independently from any email provider limits. Excessive requests from a single IP are rejected before reaching the email delivery step.
- User input is validated and sanitized in the Worker. The email provider only receives clean, bounded data.
- Worker credentials are environment variables in the Cloudflare dashboard. Nothing sensitive is in the repo.

### No persistent client-side storage

- No cookies are set without a clear, documented purpose.
- No `localStorage` or `sessionStorage` is used.
- No user data is collected or stored anywhere in this stack.

## Alternatives considered

**Looser CSP with `unsafe-inline`.** Easier to set up with SvelteKit's default inline script approach. Not acceptable here. `unsafe-inline` is a meaningful XSS risk and a poor signal on a security professional's site. Nonce-based CSP takes more initial setup but is the right posture.

**Third-party analytics** (Fathom, Plausible, etc.). Both are privacy-preserving options worth considering if page view data becomes useful. The default is no analytics. Any addition requires updating the CSP and documenting the decision here.

**Client-side bot protection.** Moving the bot protection check to the browser (via a client-side widget) makes it bypassable by anyone who submits directly to the Worker endpoint. Server-side validation is the only layer that actually holds.

## Consequences

- Adding any third-party script in the future requires a CSP update and a documented justification. This is a forcing function, not a bureaucratic hurdle.
- The security posture is testable: security headers can be verified in Playwright E2E tests and audited with tools like Mozilla Observatory.
- `npm audit` failures block CI. The team (one person) is responsible for resolving or explicitly accepting findings before merging.
- The contact form Worker needs rate limiting logic written explicitly. Cloudflare's built-in rate limiting rules can supplement the Worker-level check.

## Amendments

- **Nonce-based CSP doesn't work with a fully prerendered site.** SvelteKit throws a build error if `kit.csp.mode` is `'nonce'` while prerendering — a nonce baked into a static HTML file at build time and served identically to every visitor isn't a nonce. `kit.csp.mode` is set to `'auto'` instead: hash-based CSP for prerendered pages (all of them today), nonce-based for any route rendered per-request in the future (the contact form action, if it ever needs an inline script). Same "no `unsafe-inline`" guarantee, correct mechanism for static output.
- **CSP and fixed-header delivery is split by response type.** SvelteKit emits the static hash-based CSP in a meta tag so its inline hydration bootstrap can use the generated hash. Root `_headers` supplements it with the HTTP-only `frame-ancestors` directive and the other fixed headers. `src/hooks.server.ts` adds those fixed headers to Worker-rendered responses, while SvelteKit supplies that route's nonce-bearing CSP. This avoids blocking hydration or accidentally replacing SvelteKit's dynamic CSP.
- **The contact form's Worker-level rate limiting (referenced above under "Contact form Worker") is a Cloudflare KV-backed fixed window: 5 submissions per 60 seconds per IP.** Cloudflare's native rate-limit binding isn't supported on Pages Functions, so `env.CONTACT_FORM_RATE_LIMITER` was undefined in every deployed request until this was closed (see [GitHub issue #216](https://github.com/andrewpucci/andrewpucci.com/issues/216)). Four options were weighed:
  - A **zone-level WAF rate limiting rule** was ruled out first: it lives entirely outside the repo, invisible to tests and to anyone reading the codebase.
  - A **Durable Object** was tried next and got as far as a working, unit-tested implementation before hitting a hosting dead end: `@sveltejs/adapter-cloudflare`'s generated `_worker.js` exports only `default`, and Cloudflare requires a DO class to be exported by name from the script its binding points at. Hosting it would have needed a second, independently deployed Worker (cross-script binding) — real operational surface for what should be a self-contained gap fix.
  - **Migrating the project from Pages to Workers** would make the native rate-limit binding just work, but changes the deploy target for a fix that shouldn't need one — bigger than this gap calls for.
  - **KV** won: no class hosting, just a data binding, so it fits the existing single-Pages-project architecture unchanged. The accepted tradeoff is KV's eventual consistency (writes can take up to ~60 seconds to propagate globally), which means a determined abuser distributed across edge locations could exceed the nominal limit by a small margin. That's acceptable here because Turnstile, not rate limiting, is the primary abuse control on this form — rate limiting is defense-in-depth, and the implementation fails open on any KV error rather than blocking legitimate submissions.
- **Single-maintainer constraints change which governance controls are meaningful.** Protections that depend on an independent reviewer are only useful when there is actually another reviewer available to provide that control. This repository still enforces the controls that materially improve a one-maintainer public project: required CI before changes land on `main`, blocked deletion and non-fast-forward updates on the default branch, signed commits, a published security policy, dependency and workflow hygiene, and automated security scanning. If the project gains a second active maintainer, reviewer-dependent controls should be revisited.
