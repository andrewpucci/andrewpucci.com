# Repository Guidelines

## Project Structure & Module Organization

This repository is an Eleventy v3 static site. Authoring source lives in `src/site/`, with shared data in `src/site/_data/`, layouts in `src/site/_layouts/`, reusable partials in `src/site/_includes/`, and Sass in `src/site/assets/styles/`. Custom Eleventy logic lives in `src/utils/` for filters, shortcodes, image helpers, and minification. Tests are split between `tests/unit/` for Vitest coverage and `tests/e2e/` for Playwright flows. Build output goes to `dist/` and should be treated as generated.

## Build, Test, and Development Commands

Use `npm ci` to install dependencies. Run `npm run dev` for the local Eleventy server with a clean rebuild and live reload on `http://localhost:8080`. Use `npm run build` for a production build and `npm run serve` to serve the current build without rebuilding. `npm test` runs the CI-style unit test and lint pass. `npm run test:e2e` runs Playwright against the local site, and `npm run test:ci` runs the full local validation path.

## Coding Style & Naming Conventions

This is an ESM-only codebase; use `import`/`export`, not CommonJS. Formatting is enforced with `oxfmt`, and linting uses `oxlint`; run `npm run lint:fix` before opening a PR. Keep JavaScript, Nunjucks, and Markdown changes small and readable. Match existing file patterns such as `*.test.js` for unit tests, `*.spec.js` for E2E, and resume entries like `src/site/resume/entries/work/2022-expel-senior-ux-designer.md`.

## Testing Guidelines

Unit tests run with Vitest and `happy-dom`; E2E coverage uses Playwright. Maintain the existing 80% coverage threshold for lines, functions, branches, and statements with `npm run test:coverage`. Add or update unit tests when touching `src/utils/` or site data logic, and add E2E tests for navigation, page structure, or other visitor-facing behavior.

## Commit & Pull Request Guidelines

Recent history favors short, imperative commit messages, often with a prefix like `fix:` or `refactor:` and an issue or PR reference when relevant. Keep commits focused and explain user-visible changes in the PR description. Link the related issue, note any environment or content migrations, and include screenshots for layout or styling changes. Before requesting review, run `npm run test:ci`.

## Configuration & Content Notes

Copy `.env-sample` to `.env` and set `ROOT_URL` before local development or E2E testing. Do not commit secrets. When adding portfolio or resume content, prefer editing Markdown in `src/site/portfolio/` or `src/site/resume/entries/` rather than generated output.

## Agent skills

### Issue tracker

Issues live in GitHub Issues for this repo (`gh` CLI); external PRs are not a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary — `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — one `CONTEXT.md` at the repo root plus `docs/adr/` for architectural decisions. See `docs/agents/domain.md`.
