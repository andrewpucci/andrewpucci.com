# andrewpucci.com

Andrew Pucci's public portfolio site. The app is built with SvelteKit and deployed to Cloudflare Pages.

## Tech Stack

- SvelteKit 2 with `adapter-cloudflare`
- Svelte 5
- Storybook 10
- Vitest and Playwright
- Terrazzo design tokens
- Cloudflare Pages + Workers runtime for the contact form
- Vite+ (`vp`) for install, dev, check, test, build, and preview

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

To exercise the contact form locally through the Cloudflare Pages runtime, copy
`.env-sample` to `.dev.vars` and provide the Turnstile and email-related values
shown there. Do not create a `.env` file alongside it: Wrangler loads only one
local environment file.

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

Configure the following runtime values for both the Preview and Production
environments in the Cloudflare Pages dashboard:

| Name                        | Dashboard type       | Purpose                                   |
| --------------------------- | -------------------- | ----------------------------------------- |
| `PUBLIC_TURNSTILE_SITE_KEY` | Environment variable | Renders the client-side Turnstile widget. |
| `TURNSTILE_SECRET_KEY`      | Encrypted secret     | Verifies Turnstile submissions.           |
| `RESEND_API_KEY`            | Encrypted secret     | Authenticates email delivery.             |
| `CONTACT_TO_EMAIL`          | Encrypted secret     | Receives contact submissions.             |
| `CONTACT_FROM_EMAIL`        | Encrypted secret     | Provides the verified Resend sender.      |

`CONTACT_FORM_RATE_LIMITER` is the only non-variable contact-form binding; it
is declared in `wrangler.jsonc` and does not need a dashboard value.

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

## License

GPL-3.0. See [LICENSE](LICENSE).
