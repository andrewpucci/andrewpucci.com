# Repository Guidelines

## Project Structure & Module Organization

This repository is a SvelteKit migration baseline that still carries the legacy Eleventy site for comparison and fallback validation. Active app code lives in `src/routes/` and `src/lib/`, with Svelte content in `src/lib/content/`, shared assets in `static/`, and design-token/build configuration at the repo root. The legacy Eleventy source remains in `src/site/` and `src/utils/`. Vitest coverage now lives in source-adjacent `*.test.ts` files plus the existing `tests/unit/` coverage, and Playwright coverage stays in `tests/e2e/`. Build output goes to `dist/` and should be treated as generated.

## Build, Test, and Development Commands

Use `npm ci` to install dependencies. Run `npm run dev` for the active SvelteKit app, `npm run preview` to serve the built app, and `npm run check` for the SvelteKit typecheck path. Use `npm run legacy:dev` and `npm run legacy:build` when validating the retained Eleventy baseline on `http://localhost:8080`. `npm test` runs lint plus Vitest, `npm run test:e2e` runs Playwright, and `npm run test:ci` runs the full local validation path.

## Coding Style & Naming Conventions

This is an ESM-only codebase; use `import`/`export`, not CommonJS. Formatting is enforced with `oxfmt`, and linting uses `oxlint`; run `npm run lint:fix` before opening a PR. Keep JavaScript, TypeScript, Svelte, Nunjucks, and Markdown changes small and readable. Match existing file patterns such as source-adjacent `*.test.ts` for SvelteKit unit tests, `tests/unit/*.test.js` for retained legacy unit coverage, `*.spec.js` for E2E, and resume entries like `src/lib/content/resume/work/2022-expel-senior-ux-designer.md`.

## Testing Guidelines

Unit tests run with Vitest and `happy-dom`; E2E coverage uses Playwright. Maintain the existing 80% coverage threshold for lines, functions, branches, and statements with `npm run test:coverage`. Add or update unit tests when touching `src/utils/`, `src/lib/content/`, or server-side route logic, and add E2E tests for navigation, page structure, forms, or other visitor-facing behavior.

## Commit & Pull Request Guidelines

Recent history favors short, imperative commit messages, often with a prefix like `fix:` or `refactor:` and an issue or PR reference when relevant. Keep commits focused and explain user-visible changes in the PR description. Link the related issue, note any environment or content migrations, and include screenshots for layout or styling changes. Before requesting review, run `npm run test:ci`.

## Configuration & Content Notes

Copy `.env-sample` to `.env` and set `ROOT_URL` before local development or E2E testing. Do not commit secrets. When adding portfolio or resume content, prefer editing Markdown in `src/lib/content/portfolio/` or `src/lib/content/resume/` for the active SvelteKit site, and only touch `src/site/` when intentionally updating the retained legacy baseline.

## Agent skills

### Issue tracker

Issues live in GitHub Issues for this repo (`gh` CLI); external PRs are not a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary — `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — one `CONTEXT.md` at the repo root plus `docs/adr/` for architectural decisions. See `docs/agents/domain.md`.
