# andrewpucci.com

Andrew Pucci's public portfolio site. The app is built with SvelteKit and deployed to Cloudflare Pages.

## Tech Stack

- SvelteKit 2 with `adapter-cloudflare`
- Svelte 5
- TypeScript-first application and tooling
- Storybook 10
- Vitest and Playwright
- Terrazzo design tokens
- Cloudflare Pages + Workers runtime for the contact form
- Vite+ (`vp`) for install, dev, check, test, build, and preview

## Accessibility And Browser Support

- WCAG 2.2 AA is the accessibility floor. See [ADR-0002](docs/adr/0002-accessibility-standards.md).
- The production bundle explicitly targets Vite's `baseline-widely-available` browser set in [vite.config.ts](vite.config.ts). That is a modern-browser build floor, not the full accessibility contract.
- Supported browsers for QA and bug-fix triage are the latest stable Chrome, Firefox, and Safari on desktop, plus the latest stable Safari on iOS and Chrome on Android.
- Older browsers outside Vite's modern ESM/Baseline range are not part of the support contract unless a future ADR expands that scope.
- Automated accessibility coverage comes from Storybook a11y checks plus `@axe-core/playwright` in the Playwright suite.
- Manual accessibility verification remains required for keyboard-only flows and for real browser + assistive-technology combinations. At minimum, spot-check:
  - one current Windows screen-reader/browser pair
  - VoiceOver + Safari on macOS
  - one current mobile screen-reader/browser pair on iOS or Android

## Project Structure

```text
src/
├── lib/
│   ├── assets/          # Bundled app assets
│   ├── components/      # Reusable Svelte components
│   ├── content/         # Portfolio, archive, resume, and author content loaders
│   └── utils/           # Shared TypeScript utilities
├── routes/              # SvelteKit routes
static/                  # Public assets copied as-is
tests/e2e/               # Playwright coverage
tokens/                  # DTCG token source
```

## Getting Started

Prerequisites:

- Vite+ installed globally as `vp`
- Node.js 24.x

Install dependencies and start the dev server:

```bash
asdf install
vp install
vp dev
```

The dev server runs on `http://localhost:8080`.

To exercise the contact form locally through the Cloudflare Pages runtime
(`vp run preview:pages`), copy `.dev.vars.example` to `.dev.vars` and provide
the Turnstile and email-related values shown there.

`vp dev` is a Vite server and never reads `.dev.vars`, so the contact form
stays hidden there until `PUBLIC_TURNSTILE_SITE_KEY` is present in a `.env`
file (also gitignored). The two files coexist safely: Wrangler prefers
`.dev.vars` and only falls back to `.env` when `.dev.vars` is absent.

## Common Commands

```bash
vp dev
vp build
vp preview
vp run preview:pages
vp check
vp run check:svelte
vp test
vp run test:e2e
vp run test:ci
```

`vp preview` serves the built app on `http://localhost:4173` via a plain Node
preview server: `_headers`, `_redirects`, and the Worker bindings are not
applied. Use `vp run preview:pages` (Wrangler, same port) when you need the
real Cloudflare Pages behavior -- that is what the E2E suite runs against.

`vp run test:ci` enforces the Vitest coverage threshold before running that
production-style E2E preview.

## Code Conventions

Prefer TypeScript for new or modified code whenever the surrounding tool supports it. JavaScript should only remain where a specific runtime or tool requires it; otherwise use `.ts` and keep types explicit enough for `vp check` and `vp run check:svelte` to stay green.

## Testing

- `vp check`: format, lint, and TypeScript type checks
- `vp run check:svelte`: `svelte-check`, the only typecheck that covers `.svelte` files
- `npm run test:coverage`: coverage report with the 80% threshold (uses the local Vite+ binary)
- `vp run test:e2e`: Playwright against the built app
- `vp run test:ci`: local CI path

See [tests/e2e/README.md](tests/e2e/README.md) for Playwright details.

## Deployment

`wrangler.jsonc` is the source of truth for Cloudflare Pages configuration.

| Cloudflare Pages setting | Value                                                                                                       |
| ------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Build command            | `npm run build` (the Pages build image has no global `vp`; the script resolves it from `node_modules/.bin`) |
| Build output             | `.svelte-kit/cloudflare`                                                                                    |
| Production branch        | `main`                                                                                                      |

The non-secret `PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_HOSTNAMES` values
are defined in `wrangler.jsonc`. Configure the following secrets for both the
Preview and Production environments in the Cloudflare Pages dashboard:

| Name                 | Dashboard type   | Purpose                         |
| -------------------- | ---------------- | ------------------------------- |
| `TURNSTILE_SECRET`   | Encrypted secret | Verifies Turnstile submissions. |
| `RESEND_API_KEY`     | Encrypted secret | Authenticates email delivery.   |
| `CONTACT_TO_EMAIL`   | Encrypted secret | Receives contact submissions.   |
| `CONTACT_FROM_EMAIL` | Encrypted secret | Provides the verified sender.   |

### Contact-form rate limiting

ADR-0003 calls for rate limiting enforced in the Worker, independent of
Resend's own limits. Cloudflare Pages doesn't support the native
[rate limit binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
(`env.CONTACT_FORM_RATE_LIMITER` was undefined in every deployed request), so
the contact form action enforces its own fixed-window limit — 5 submissions
per 60 seconds per IP — backed by a Cloudflare KV namespace bound in
`wrangler.jsonc`. See
[ADR-0003](docs/adr/0003-security-posture.md#amendments) for why KV was
chosen over a Durable Object, a zone-level WAF rule, and migrating off Pages.

Host-level routing and security headers live at the repo root in [_redirects](_redirects) and [_headers](_headers).

## Content Notes

- Active portfolio case studies: `src/lib/content/portfolio/`
- Archived portfolio case studies: `src/lib/content/archive/`
- Resume content: `src/lib/content/resume/`
- Public files and screenshots: `static/`

## Workflow

Before opening a PR, run:

```bash
vp check
vp run check:svelte
vp run test:ci
```

Contribution and security expectations are documented in
[CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md).

## License

GPL-3.0. See [LICENSE](LICENSE).
