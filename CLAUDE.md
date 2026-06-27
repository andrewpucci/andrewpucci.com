# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (updates browserslist db, cleans dist/, builds, and starts live-reload server)
npm run dev

# Serve without rebuilding (useful when running E2E tests separately)
npm run serve

# Production build
npm run prod

# Lint and unit tests (what CI runs first)
npm test

# Unit tests only in watch mode
npm run test:watch

# Run a single unit test file
npx vitest run tests/unit/filters.test.js

# E2E tests (auto-starts dev server on port 8080)
npm run test:e2e

# Fix lint and formatting issues
npm run lint:fix
```

**Required env var**: copy `.env-sample` to `.env` and set `ROOT_URL` to your local or deployed URL (e.g., `http://localhost:8080`).

## Architecture

This is an **Eleventy v3** static site (ESM, `"type": "module"`). Source lives in `src/site/`; build output goes to `dist/`.

### Eleventy config (`.eleventy.js`)

- **Input**: `src/site/`, **Output**: `dist/`
- **Layouts dir**: `src/site/_layouts/`, **Data dir**: `src/site/_data/`
- Template formats: Nunjucks (`.njk`) and Markdown (`.md`), both processed through Nunjucks
- Asset pipeline: `eleventy-sass` compiles Sass → PostCSS (autoprefixer + cssnano) → cache-busted filenames via `eleventy-plugin-rev`
- HTML/JS minification is an Eleventy transform (`src/utils/minify.js`) that runs after render

### Collections

Four resume collections are auto-created in `.eleventy.js` from folder name: `work`, `education`, `speaking`, `volunteering`. Entries live in `src/site/resume/entries/<name>/` and are sorted by `start` frontmatter (numeric timestamp). The `entries.json` in that folder sets `permalink: false` so entries aren't built as standalone pages.

### Global data (`src/site/_data/`)

- `author.json` — personal info used across templates
- `cards.json` — portfolio card data for the home page carousel
- `strings.json` — reusable UI strings
- `site.js` — exports `rootUrl` from `ROOT_URL` env var

### Custom utilities (`src/utils/`)

| File | Purpose |
|------|---------|
| `filters.js` | Nunjucks filters: `dateToFormat` (Luxon), `obfuscate` (HTML entities for emails), `stripSpaces`, `stripProtocol` |
| `async-shortcodes.js` | Nunjucks async shortcodes: `image`, `card`, `expandableImage` |
| `image.js` | `@11ty/eleventy-img` wrapper generating WebP + JPEG at multiple widths |
| `minify.js` | Eleventy transform calling `min-html.js` / `min-js.js` |

When adding a filter or shortcode, implement it in the appropriate `src/utils/` file and register it in `.eleventy.js`.

### Testing

- **Unit tests** (Vitest + happy-dom): test files matching `**/*.test.js` except `tests/e2e/`. Coverage thresholds are 80% across lines/functions/branches/statements.
- **E2E tests** (Playwright): `tests/e2e/`. Playwright starts `npm run serve` automatically; tests hit `http://localhost:8080` (override with `TEST_BASE_URL`).

### Linting

Uses **oxlint** (not ESLint) with the config in `.oxlintrc.json`, and **oxfmt** for formatting (`.oxfmtrc.json`). ESM-only codebase — `import/no-commonjs` is enforced.

## Agent skills

### Issue tracker

Issues live in GitHub Issues for this repo (`gh` CLI); external PRs are not a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary — `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — one `CONTEXT.md` at the repo root plus `docs/adr/` for architectural decisions. See `docs/agents/domain.md`.
