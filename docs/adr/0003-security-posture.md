# ADR-0003: Security posture

Date: 2026-06-29
Status: Accepted

## Context

Andrew works in information security. A personal portfolio with weak security hygiene would be a credibility problem for someone in that role. The target audience includes security-aware hiring managers at enterprise tech companies who will notice things like missing security headers or permissive CSP directives.

The site is also a demonstration of craft. The same discipline applied to accessibility and token architecture applies here.

## Decision

### HTTP security headers

All pages ship a strict set of security headers via a `_headers` file in the Cloudflare Pages output:

- `Content-Security-Policy` — strict policy with nonces for any inline scripts. SvelteKit's `handle` hook generates nonces per request. No `unsafe-inline`, no `unsafe-eval`. External sources are allowlisted explicitly and minimally.
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
