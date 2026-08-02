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

If you want to exercise the contact form locally, copy `.env-sample` to `.env` and provide the Turnstile and email-related values shown there.

## Common Commands

```bash
vp dev
vp build
vp preview
vp check
vp test
vp run test:e2e
vp run test:ci
```

`vp preview` serves the built app on `http://localhost:4173`.

## Testing

- `vp check`: format, lint, and type checks
- `vp test run --coverage`: coverage report with the 80% threshold
- `vp run test:e2e`: Playwright against the built app
- `vp run test:ci`: local CI path

See [tests/e2e/README.md](tests/e2e/README.md) for Playwright details.

## Deployment

`wrangler.jsonc` is the source of truth for Cloudflare Pages configuration.

- Build command: `vp build`
- Build output: `.svelte-kit/cloudflare`
- Production branch: `main`

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
vp run test:ci
```

## License

GPL-3.0. See [LICENSE](LICENSE).
