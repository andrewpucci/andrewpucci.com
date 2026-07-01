# Context: andrewpucci.com

This site is Andrew Pucci's personal portfolio. It's also where the design system that powers it gets built. The two are the same project.

The portfolio makes one argument: a designer who builds things. Andrew is a principal UX designer, an accessibility practitioner, and works in information security. All three roles set the standard for this codebase. The design system architecture, token pipeline, component library, accessibility engineering, and security posture are evidence of that as much as the work on display.

These aren't separate checklists. A polished page that fails a keyboard user fails. An accessible component on a site with weak security hygiene fails. A technically sound implementation with poor information hierarchy fails. The craft holds all three at once.

Any future decision in this repo carries the weight of all three disciplines. Adding a third-party script is a security decision. Introducing a new interactive pattern is an accessibility decision. Changing the information architecture is a UX decision. Treat them that way.

## Domain vocabulary

**Design token.** A named value that carries a design decision. Tokens replace hardcoded values in component styles. This project uses three tiers: base, semantic, and component.

**Base token.** The raw value layer. Named for what the value is, not what it's used for. `color.pink.500 = #d42274`. Nothing in the codebase should reference a base token directly.

**Semantic token.** The role layer. References a primitive by its meaning. `color.brand.primary → color.pink.500`. Components consume semantic tokens.

**Component token.** The usage layer. References a semantic token for a specific component property. `button.primary.background → color.brand.primary`.

**DTCG.** Design Tokens Community Group. A W3C community spec for a standard token JSON format. Hit v1.0 stable in October 2025. Tokens in this project are DTCG-format JSON.

**Terrazzo.** The build tool that takes DTCG token JSON and generates CSS custom properties. Runs as a Vite plugin during the build. Output is a generated CSS file imported in the root layout.

**MDsvex.** A preprocessor that allows Svelte components to be embedded inside Markdown files. Used for portfolio case study pages so that live component demos can appear inline in the case study narrative.

**Story.** A Storybook file that renders a component in a specific state. Stories are the component tests; they contain `play()` interaction assertions that run in CI via Vitest.

**Snapshot.** A Chromatic unit. One story rendered in one browser at one point in time. Used for visual regression: Chromatic compares snapshots across builds and flags changes.

**Scoped styles.** CSS written in a `<style>` block inside a `.svelte` file. SvelteKit scopes them to the component automatically. They sit outside the `@layer` system and win over any layered global style without needing high specificity.

**CSS layer.** A named layer in the `@layer` cascade order. Global styles are organized into explicit layers (`reset`, `tokens`, `base`, `components`, `utilities`) to avoid specificity fights.

**Content component.** A component in `src/lib/` that knows about portfolio data shapes (resume entries, testimonials, portfolio cards) and appears in more than one route. Gets a Storybook story.

**Page section.** A layout element specific to one route. Lives in `src/routes/`, not `src/lib/`. Doesn't get a Storybook story.

**Worker.** A Cloudflare Worker. Handles server-side logic in this otherwise static site. Used for the contact form: receives the POST, validates via a bot protection service, and delivers email via a transactional email provider. Credentials are environment variables in the Cloudflare dashboard.

**Adapter.** SvelteKit's deployment abstraction. This project uses `adapter-cloudflare`, which prerenders all pages at build time and bundles Workers for any server-side routes.

**Precision Pink.** The primary brand color (`#d42274`). The sole saturated color in the palette. Used on active nav states, CTAs, timeline markers, and the full-bleed footer. Everything else is neutral.
