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

# Lint and Vitest
npm test

# SvelteKit typecheck and generated env/runtime types
npm run check

# Unit tests only in watch mode
npm run test:watch

# Run a single Vitest file
npx vitest run src/lib/content/archive.test.ts

# E2E tests (auto-starts the built app on port 4173)
npm run test:e2e

# Fix lint and formatting issues
npm run lint:fix
```

**Required env vars**: copy `.env-sample` to `.env`. `PUBLIC_TURNSTILE_SITE_KEY` controls whether the contact form renders locally; the server-side contact secrets are only needed when exercising the live form action.

## Architecture

This is a **SvelteKit** site deployed through Cloudflare Pages. Active app code lives in `src/routes/` and `src/lib/`. The shipping adapter output is `.svelte-kit/cloudflare`.

### SvelteKit + Cloudflare

- Routes live in `src/routes/`, reusable UI and content loaders in `src/lib/`
- Portfolio and resume content live under `src/lib/content/`
- Archived portfolio entries live under `src/lib/content/archive/` and are transformed at load time by `src/lib/content/archive.ts`
- `wrangler.jsonc` declares `.svelte-kit/cloudflare` as the Pages build output and configures the contact-form rate limiter
- Host-level headers and redirects live at the repo root in `_headers` and `_redirects`

### Testing

- **Vitest** (happy-dom + Storybook browser project): source-adjacent `*.test.ts` / `*.spec.ts`
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
