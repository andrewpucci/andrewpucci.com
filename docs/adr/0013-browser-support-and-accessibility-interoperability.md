# ADR-0013: Browser support follows modern Baseline targets and accessibility-supported patterns

Date: 2026-08-10
Status: Accepted

## Context

Browser support and accessibility support are related but not identical decisions. WCAG conformance depends on uses of web technologies that are accessibility supported in real browser and assistive-technology combinations, not only on whether a bundler can transpile syntax for a browser version.

This project therefore needs two separate policies:

- a browser build target for production bundles
- an accessibility verification target for browser + assistive-technology interoperability

## Decision

### Conformance target

ADR-0002 remains the accessibility standard: WCAG 2.2 AA is the floor.

### Build target

- The Vite production build target is made explicit in `vite.config.ts` as `baseline-widely-available`.
- No `@vitejs/plugin-legacy` or separate legacy-polyfill pipeline is added.

### Browser support policy

- The site is supported in the latest stable releases of Chrome, Firefox, and Safari on desktop.
- The site is also supported in the latest stable releases of Safari on iOS and Chrome on Android.
- Browsers outside Vite's modern ESM/Baseline support range are out of scope unless a future product decision expands support explicitly.

### Accessibility interoperability policy

- Native HTML is preferred over custom ARIA patterns wherever the platform provides the semantics and behavior needed.
- Accessibility verification does not stop at automated checks. Manual verification must cover keyboard-only operation for interactive flows and spot-check real browser + assistive-technology combinations.
- The minimum manual matrix is:
  - one current Windows screen-reader/browser pair
  - VoiceOver + Safari on macOS
  - one current mobile screen-reader/browser pair on iOS or Android

### Repository scaffolding

- Shared browser-target configuration is added only when an active tool consumes it.

## Alternatives considered

**Add `@vitejs/plugin-legacy` now.** Rejected. Legacy-browser bundles are a product-support decision, not an accessibility best practice by themselves. They add code, testing surface, and polyfill maintenance for browsers this project does not currently target.

**Pin fixed browser-version targets in `build.target`.** Rejected for now. The goal here is to stay aligned with current accessibility-oriented modern-browser practice rather than freeze a static version floor. If product requirements later demand a fixed compatibility contract, explicit version targets can replace the Baseline alias.

## Consequences

- The browser support contract is documented instead of inherited from tool defaults.
- The build remains modern-first and does not add legacy scaffolding by default.
- Accessibility support is treated as an interoperability concern, not only a transpilation concern.
- If analytics, audience requirements, or bug reports later justify older-browser support, the repo should add that support as an explicit policy change with matching tooling and tests.
