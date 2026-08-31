# ADR-0014: Run browser CI only for site-impacting changes

Date: 2026-08-30
Status: Accepted

## Context

The repository's original CI workflow ran static checks, Storybook interaction tests, Chromatic, Playwright across three browsers, Argos, and Lighthouse for every pull request. That made workflow-only and GitHub automation changes pay for browser jobs that could not observe the changed code. For example, an automation-only pull request spent roughly thirteen runner-minutes on the E2E matrix and another fourteen minutes on Lighthouse.

The site still needs complete browser, accessibility, visual, and performance coverage whenever rendered output can change. The policy must preserve that coverage without treating every repository file as a possible visitor-facing change.

## Decision

CI is divided by the surface it verifies:

- **Core CI** runs on every pull request and main-branch push. It performs static checks, non-rendering/server Vitest tests, and the dependency security audit. This covers application logic, workflow scripts, and test-only configuration.
- **Frontend integration** runs the full Playwright matrix, page-level axe checks, and the Chromium Argos upload when rendered source, content, static assets, token inputs, runtime/build configuration, or E2E tests change.
- **Visual regression** runs Storybook interaction tests, builds Storybook, and publishes to Chromatic when component, style, token, Storybook, or static-asset changes can affect component snapshots.
- **Performance** runs Lighthouse only when the rendered application or one of its production build inputs changes. It includes token sources and the Terrazzo configuration/plugin, which produce shipped CSS.

The Vite+ test block remains in `vite.config.ts`, as Vite+ recommends, but it is composed from `vite-test.config.ts`. Test-only changes can therefore avoid the browser workflows without treating a production Vite configuration change as safe to ignore.

All browser-focused workflows support `workflow_dispatch`. Dependency-only or other exceptional changes that might affect generated output must be dispatched manually before merge. They are not automatically selected by changed-file filters.

Cloudflare Pages build watch paths must be configured separately in the Pages dashboard. Include `src/*`, `static/*`, `tokens/*`, `terrazzo.config.ts`, `vite-plugin-terrazzo.ts`, `svelte.config.ts`, `vite.config.ts`, `wrangler.jsonc`, `package.json`, and `package-lock.json`. The package files stay included there because a production deployment must rebuild after any resolved dependency change, even though dependency-only changes do not automatically run browser CI.

## Alternatives considered

**Run all CI for every change.** Rejected. It provides no additional browser signal for documentation and GitHub automation changes while consuming substantial runner time.

**Skip all configuration changes.** Rejected. Vite, SvelteKit, Wrangler, and the token build pipeline can change the generated site without touching `src/`.

**Filter only Lighthouse.** Rejected. Playwright, Argos, Storybook interaction tests, and Chromatic have the same site-surface dependency and were still the majority of the wasted browser work.

**Automatically classify dependency types.** Rejected. Parsing direct and transitive dependency impact would add a more complex and less trustworthy policy than an explicit manual dispatch for the uncommon exception.

## Consequences

- Browser CI latency and runner consumption decrease for automation, documentation, and test-only changes.
- A rendered-site change continues to receive functional, accessibility, visual, and performance checks appropriate to its surface.
- The applicable workflows must not be configured as required status checks unless their skipped state is handled by a separate always-running gate; GitHub leaves path-filtered required workflows pending.
- This ADR supersedes ADR-0008 and ADR-0010 only where they require Chromatic or Lighthouse on every push or deployment. Their testing and component-model decisions remain accepted.
