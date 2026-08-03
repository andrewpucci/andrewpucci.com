# Repository Guidelines

## Project Structure & Module Organization

This repository is a SvelteKit site. Active app code lives in `src/routes/` and `src/lib/`, with content in `src/lib/content/`, shared assets in `static/`, and design-token/build configuration at the repo root. Vitest coverage lives in source-adjacent `*.test.ts` files, and Playwright coverage stays in `tests/e2e/`. Generated output includes `.svelte-kit/`, `storybook-static/`, and Playwright artifacts.

## Build, Test, and Development Commands

Install the Vite+ CLI (`vp`) first, then use `vp install` for dependencies. Run `vp dev` for local development, `vp preview` to serve the built app, `vp check` for the default static validation path, `vp run check:svelte` for the Svelte/TypeScript typecheck that `vp check` cannot cover, and `vp test` for Vitest. Use `vp run test:e2e` for Playwright and `vp run test:ci` for the local regression path.

## Coding Style & Naming Conventions

This is an ESM-only codebase; use `import`/`export`, not CommonJS. Formatting and linting run through Vite+ (`vp fmt`/`vp lint`, configured in the `fmt` and `lint` blocks of `vite.config.ts`); run `vp check --fix` before opening a PR. Keep JavaScript, TypeScript, Svelte, and Markdown changes small and readable. Match existing file patterns such as source-adjacent `*.test.ts`, `*.stories.svelte`, `*.spec.js`, and resume entries like `src/lib/content/resume/work/2022-expel-senior-ux-designer.md`.

## Testing Guidelines

Vitest runs non-rendering tests with `happy-dom`, and Storybook interaction tests run in Vitest's browser project; E2E coverage uses Playwright. Maintain the existing 80% coverage threshold for lines, functions, branches, and statements with `vp test run --coverage`. Add or update tests when touching `src/lib/content/`, server-side route logic, or reusable utilities, and add E2E tests for navigation, page structure, forms, or other visitor-facing behavior.

## Commit & Pull Request Guidelines

Recent history favors short, imperative commit messages, often with a prefix like `fix:` or `refactor:` and an issue or PR reference when relevant. Keep commits focused and explain user-visible changes in the PR description. Link the related issue, note any environment or content migrations, and include screenshots for layout or styling changes. Before requesting review, run `vp check` and `vp run test:ci`.

## Configuration & Content Notes

Copy `.env-sample` to `.env` before exercising the contact form locally. Do not commit secrets. When adding portfolio or resume content, prefer editing Markdown in `src/lib/content/portfolio/`, `src/lib/content/archive/`, or `src/lib/content/resume/`.

## Agent skills

### Issue tracker

Issues live in GitHub Issues for this repo (`gh` CLI); external PRs are not a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary — `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — one `CONTEXT.md` at the repo root plus `docs/adr/` for architectural decisions. See `docs/agents/domain.md`.
