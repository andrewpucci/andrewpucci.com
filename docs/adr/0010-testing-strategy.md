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
