# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Active SvelteKit development server
npm run dev

# Preview the built Cloudflare Pages output
npm run preview

# Production SvelteKit build
npm run build

# Lint and unit tests
npm test

# SvelteKit typecheck and generated env/runtime types
npm run check

# Unit tests only in watch mode
npm run test:watch

# Run a single unit test file
npx vitest run tests/unit/filters.test.js

# E2E tests (auto-starts the built app on port 4173)
npm run test:e2e

# Retained legacy Eleventy validation path
npm run legacy:build

# Fix lint and formatting issues
npm run lint:fix
```

**Required env vars**: copy `.env-sample` to `.env`. `ROOT_URL` is still used by the retained legacy Eleventy site, and `PUBLIC_TURNSTILE_SITE_KEY` is required for the live contact form.

## Architecture

This is a **SvelteKit** site deployed through Cloudflare Pages, with the previous Eleventy v3 site retained in-repo for comparison and fallback validation. Active app code lives in `src/routes/` and `src/lib/`; the legacy Eleventy source remains in `src/site/` and `src/utils/`. The shipping build output is `.svelte-kit/cloudflare`.

### SvelteKit + Cloudflare

- Routes live in `src/routes/`, reusable UI and content loaders in `src/lib/`
- Case studies are MDsvex-backed Markdown modules in `src/lib/content/portfolio/`
- `wrangler.jsonc` declares `.svelte-kit/cloudflare` as the Pages build output and configures the contact-form rate limiter
- Host-level headers and redirects live at the repo root in `_headers` and `_redirects`

### Legacy Eleventy config (`.eleventy.js`)

- **Input**: `src/site/`, **Output**: `dist/`
- Keeps the previous Nunjucks/Markdown site runnable via `npm run legacy:*`
- Still owns the old filters, shortcodes, and data files under `src/utils/` and `src/site/_data/`

### Content and utilities

- Active content lives in `src/lib/content/`
- The legacy Eleventy data files still live in `src/site/_data/`; `site.js` is the remaining `ROOT_URL` consumer
- Legacy Nunjucks filters and shortcodes still live under `src/utils/`

### Testing

- **Unit tests** (Vitest + happy-dom): source-adjacent `*.test.ts` plus retained legacy tests in `tests/unit/`
- **E2E tests** (Playwright): `tests/e2e/`. Playwright starts `npm run build && npm run preview`; tests hit `http://localhost:4173` by default (override with `TEST_BASE_URL`).

### Linting

Uses **oxlint** (not ESLint) with the config in `.oxlintrc.json`, and **oxfmt** for formatting (`.oxfmtrc.json`). ESM-only codebase — `import/no-commonjs` is enforced.

## Agent skills

### Issue tracker

Issues live in GitHub Issues for this repo (`gh` CLI); external PRs are not a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary — `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — one `CONTEXT.md` at the repo root plus `docs/adr/` for architectural decisions. See `docs/agents/domain.md`.
