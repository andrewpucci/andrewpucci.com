# ADR-0002: Accessibility standards

Date: 2026-06-29
Status: Accepted

## Context

Andrew is an accessibility practitioner. An inaccessible portfolio would directly contradict the argument the site makes. Accessibility is not a compliance pass at the end of a build; it's a design constraint from the first component.

The existing Eleventy site had documented accessibility failures: no skip-to-content link, auto-playing carousel with no pause mechanism (WCAG 2.2.2), missing reduced-motion support in animations, and color-only active states in the nav. These are carried forward as known debt in the current build and are P0/P1 items in the new one.

## Decision

### Conformance target

WCAG 2.2 AA is the floor. AAA criteria are pursued where they don't conflict with design intent.

### Page structure

- Every page includes a skip-to-content link as the first focusable element.
- Heading hierarchy is enforced: one `h1` per page, no heading levels skipped.
- Landmark regions (`<main>`, `<nav>`, `<header>`, `<footer>`) are present and labeled where more than one of the same type exists on a page.

### Focus management

- Focus indicators are visible on all interactive elements and meet a 3:1 contrast ratio against adjacent colors (WCAG 1.4.11).
- Focus order follows the visual reading order.
- Components that move focus programmatically (modals, drawers, dynamic content) return focus to the trigger on close.

### Motion

- Every animation and transition has a `prefers-reduced-motion: reduce` alternative. The alternative is typically a crossfade or instant transition.
- No content is gated behind an animation completing. Animated reveals use a visible default state; the motion is enhancement, not a reveal gate.
- Auto-playing or looping content (carousels, video) includes pause controls that are keyboard-accessible.

### Color and contrast

- Body text: minimum 4.5:1 contrast against its background.
- Large text (18px regular or 14px bold and above): minimum 3:1.
- UI components and focus indicators: minimum 3:1.
- No color-only state communication. Active states, error states, and status indicators use shape, text, or icon in addition to color.

### Semantic markup and ARIA

- Native HTML elements are used where they exist. ARIA is added only when native semantics are insufficient.
- Interactive components follow ARIA Authoring Practices Guide patterns (menus, dialogs, tabs, accordions).
- All images have meaningful `alt` text. Decorative images use `alt=""`.
- Form inputs have visible labels. Error messages are programmatically associated with their inputs.

### Testing

- The Storybook accessibility addon runs on every story. Violations surface in the Storybook UI during development.
- `@axe-core/playwright` runs in Playwright E2E tests on all page-level routes and fails CI on any violation.
- Keyboard navigation is manually verified for all interactive patterns before a component is considered complete.

## Alternatives considered

**Automated testing only.** `axe-core` catches roughly 30–40% of WCAG issues automatically. It's a necessary layer, not a sufficient one. Manual keyboard testing and screen reader spot-checks cover what automated tools miss.

**WCAG 2.1 as the target.** 2.2 supersedes 2.1 and adds criteria that matter in practice (focus appearance, drag alternatives, redundant entry). There's no reason to aim at the older version.

## Consequences

- A component without a passing accessibility story doesn't ship. Stories include the Storybook a11y addon check as part of the definition of done.
- Playwright CI fails on `axe-core` violations. Violations must be resolved or explicitly documented as accepted exceptions before merging.
- Any accepted exception is noted here as an amendment with a rationale and a remediation plan.
- The carousel on the current site is a P0 item. The replacement in the new build ships with keyboard controls, pause support, and a `prefers-reduced-motion` alternative from the start.
