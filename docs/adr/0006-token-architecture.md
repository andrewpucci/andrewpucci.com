# ADR-0006: Design tokens: three-tier DTCG via Terrazzo

Date: 2026-06-29
Status: Accepted

## Context

Bootstrap 5 used Sass variables for design values. They compile away at build time and aren't accessible at runtime. The goal is a token pipeline that mirrors how Andrew's employer's design system is built: DTCG-format JSON, a build tool that generates CSS custom properties, runtime-accessible values that can be inspected in DevTools.

## Decision

Tokens are defined in DTCG-format JSON under `tokens/`. Terrazzo runs as a Vite plugin (`@terrazzo/vite`) and generates CSS custom properties during the build. The generated CSS is imported in SvelteKit's root layout.

Three tiers:

**Base tokens.** Raw values, named for what they are. `color.pink.500 = #d42274`, `color.gray.900 = #212529`, `space.3 = 1.125rem`. Nothing in components should reference a base token directly.

**Semantic tokens.** Named for their role. `color.brand.primary → color.pink.500`, `color.text.default → color.gray.900`. Components consume semantic tokens via CSS custom properties: `var(--color-brand-primary)`.

**Component tokens.** Named for their specific usage. `button.primary.background → color.brand.primary`, `card.border-color → color.border.subtle`. Used inside component `<style>` blocks.

## Alternatives considered

**Two-tier (no base layer).** Semantic tokens point directly to raw values: `color.brand.primary = #d42274`. Simpler with a small palette. Works at this scale. But it skips demonstrating why the base layer exists: changing `color.pink.500` from `#d42274` to a new value should update every semantic and component token that references it automatically. The base layer is what makes that work.

**Sass variables (Bootstrap approach).** Compile-time only. Not accessible at runtime. Can't be inspected in DevTools. Don't work with the CSS `color-scheme` property or any runtime theming.

**CSS custom properties written by hand.** Works but isn't the production design system architecture this portfolio demonstrates. Also loses Terrazzo's type checking and DTCG spec compliance.

## Consequences

- Token JSON lives at `tokens/tokens.json`. It's the source of truth for all design values.
- Terrazzo generates CSS custom properties into `src/lib/tokens/tokens.css`, imported in `src/routes/+layout.svelte`.
- Changing a base token value propagates through every semantic and component token that references it.
- The DTCG spec hit v1.0 stable in October 2025. The format is finalized.
- Terrazzo's Vite plugin means tokens regenerate automatically during `vite dev` when the token JSON changes.
- Terrazzo scored 5.3 on OpenSSF Scorecard, low enough to require the exception process described in ADR-0003. Accepted as a documented exception there.

## Amendments

- **No `@terrazzo/vite` package exists.** Terrazzo ships as a CLI (`@terrazzo/cli` + `@terrazzo/plugin-css`) driven by `terrazzo.config.js`, not a first-party Vite plugin. The "runs as a Vite plugin" behavior is provided by a small in-repo wrapper (`vite-plugin-terrazzo.ts`) that shells out to the CLI and watches `tokens/tokens.json` for changes in dev, calling `server.ws.send({ type: 'full-reload' })` after a rebuild. Functionally equivalent to what this ADR describes; the package name was wrong.
  - The wrapper deliberately does **not** run the CLI from a `buildStart` hook or unconditionally from `configureServer`, despite both being the obvious places to put it. Both caused real, reproducible failures: `buildStart` broke SvelteKit's client/server build coordination outright (pages built, but every route threw a hydration error, `Cannot read properties of undefined (reading 'data')`, with no other change); calling it unconditionally at the top of `configureServer` caused a restart storm (writing `src/lib/tokens/tokens.css` from inside that hook appears to itself qualify as a reason for Vite to restart the dev server, which re-enters `configureServer`, which writes the file again -- dozens of `tz build` processes spawned within seconds). The wrapper now only reacts to `tokens.json` changing; the initial build for both `dev` and `build`/`check` runs as its own sequential `npm run tokens:build` step first, so Vite never sees a plugin rewrite a source file out from under its own build.
- **DTCG `dimension` tokens can't hold a fluid `clamp()` expression** (a dimension is a single value + unit, e.g. `{ "value": 1.125, "unit": "rem" }`). The Display and Headline type-scale entries needed their fluid min/max split into two separate dimension tokens (`font.size.display-min`/`-max`, `font.size.headline-min`/`-max`) instead of one token holding the clamp string. The `typography` composite token's `fontSize` references the `-min` value as the nominal size; the actual fluid `clamp()` rule is assembled in component CSS from the paired tokens (see ADR-0007).
