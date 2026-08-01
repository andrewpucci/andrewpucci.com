# ADR-0010: Testing strategy

Date: 2026-06-29
Status: Accepted

## Context

The existing Eleventy site used Vitest for unit tests and Playwright for E2E. Adding Storybook introduces a third option: `@storybook/test` interaction tests that live inside story files and run via Vitest. The question is whether to maintain a separate Vitest component test layer alongside Storybook stories, or let the stories be the tests.

## Decision

Three-layer testing stack:

**Vitest.** Pure utility functions in `src/lib/utils/`. No component rendering. Date formatting, token helpers, content processing, frontmatter parsing utilities.

**Storybook interaction tests.** Component behavior, keyboard navigation, ARIA state changes, interactive states. Written as `play()` functions inside story files. Run in CI via Vitest's Storybook project integration. This is the component testing layer. There is no separate Vitest component test layer.

**Playwright.** Full E2E flows: page navigation, contact form submission end-to-end, page structure, and accessibility at the page level via `@axe-core/playwright`. Axe runs on every page route and fails CI on any violation. See ADR-0002.

**Lighthouse.** Performance, Core Web Vitals, best practices, and SEO gates on every deployment. Enforces the usability thresholds defined in ADR-0001. Run via the `lighthouse` CLI directly in a GitHub Actions step — not via `@lhci/cli`, which scored 3.7 on OpenSSF Scorecard and hasn't had a commit to main since June 2025. The core `lighthouse` package (GoogleChrome/lighthouse) is actively maintained, scored 6.7, and includes a CLI with JSON output suitable for threshold assertion.

## Alternatives considered

**Vitest component tests alongside Storybook stories.** Maintaining both means writing each component twice: once as a story for visual documentation and once as a test for behavioral assertions. Most of what a component test would assert is already expressed in the story. Redundant.

**Playwright for everything.** E2E tests can cover component behavior, but they're slow and don't integrate with Chromatic's visual regression pipeline. Better as the last layer, not the only layer.

## Consequences

- A component without a story has no behavioral tests. Stories are the contract.
- Visual regression coverage comes from Chromatic on every push. No separate visual testing tool needed.
- CI runs two test suites: Vitest (utility functions and Storybook interaction tests) and Playwright (E2E flows). Same shape as before, different coverage distribution.
- The 80% coverage threshold from the previous Vitest config carries forward, now spanning utility functions and interaction tests.
- `npm audit` runs in CI and fails on high or critical severity findings. See ADR-0003.
- Lighthouse runs on every deployment via the `lighthouse` CLI and enforces the thresholds defined in ADR-0001.

## Amendments

- **The Vitest layer is bounded by "no component rendering", not by `src/lib/utils/`.** The original wording ("Pure utility functions in `src/lib/utils/`") bolted a location rule onto a rendering rule, and only the rendering rule survived contact with the codebase. Three Vitest files legitimately live outside `src/lib/utils/` and none of them test a utility: `src/lib/content/resume.test.ts` and `src/lib/content/portfolio.test.ts` cover the content loaders, and `src/routes/contact/page.server.test.ts` (no `+` prefix, which SvelteKit would read as a route file) covers the contact action's validation, rate-limiting, Turnstile, and Resend branches against a mocked platform. That last one is the clearest case — it exercises real branching logic, renders nothing, and a literal reading of the location clause would delete it. Read the Vitest layer as **non-rendering logic anywhere in `src/`**. The boundary that is actually enforced, and that keeps this layer from duplicating Storybook, is that Vitest never renders a component.
- **The `client` Vitest project has been removed from `vite.config.ts`.** The SvelteKit template scaffolds three Vitest projects — `client` (browser-mode, `include: ['src/**/*.svelte.{test,spec}.{js,ts}']`), `server`, and `storybook`. The `client` project is precisely the separate Vitest component test layer this ADR rules out, and it shipped configured, dependency-backed (`vitest-browser-svelte`), and matching zero files. An empty contradiction is still a contradiction: it was a documented, green-on-first-run on-ramp to the layer we decided against, and nothing warned a contributor who added a `Foo.svelte.test.ts`. Deleting it makes this ADR self-enforcing rather than aspirational. `@vitest/browser-playwright` stays — the `storybook` project uses it as its browser provider.
- **Source-string assertions are not a substitute for a story.** `CaseStudyMedia.test.ts` was deleted rather than migrated: it `readFileSync`'d the component and asserted `toContain('<img {src} {alt} />')`, which pins the source text without rendering anything or proving any behavior, while looking from the outside like the component was covered. Where a component needs assertions, the answer is a story with a `play()` function. Grepping a component's source is worse than no test, because it costs the same maintenance and buys the reader false confidence.
