# ADR-0004: Framework: SvelteKit over Eleventy

Date: 2026-06-29
Status: Accepted

## Context

The site was built on Eleventy v3 (rebranded to Build Awesome in March 2026). The stack included Bootstrap 5 for styles and Nunjucks for templates. Both were overdue for replacement.

The main goals for a new stack: a real component model for building a design system, first-class TypeScript, and a Storybook integration where the same component files the site uses are what Storybook renders. Eleventy's Nunjucks template model doesn't satisfy any of those. Templates aren't components; they can't be rendered interactively in Storybook.

## Decision

Use SvelteKit with `adapter-cloudflare`. All pages are prerendered at build time. Server-side logic runs in Cloudflare Workers and is scoped to the contact form.

## Alternatives considered

**Eleventy (Build Awesome v4).** Still maintained with full backwards compatibility. But Nunjucks templates aren't interactive components, so Storybook support would be marginal at best. The Build Awesome rebrand under Font Awesome also raised questions about long-term direction.

**Astro.** The dominant SSG in 2026. Strong choice for content-first sites, zero JS by default. The problem: `.astro` files are server-rendered HTML templates, not reactive components. Storybook renders them as static HTML snapshots with no interactivity. Building a real design system in Astro means writing components in a second framework (Svelte or React) as islands, then wrapping them in `.astro` pages. That's two component models for one project.

**TanStack Start.** Good type safety and an official Storybook integration in Storybook 10.4. Designed for app-shaped problems: dashboards, SaaS, full-stack data flows. A personal portfolio is a content-shaped problem. Most of the TanStack stack (Query, Form, Table, Virtual) wouldn't be used.

## Consequences

- Svelte 5 runes are the reactivity model. Components use `$props()`, `$state()`, `$derived()`.
- All routes under `src/routes/` prerender to static HTML. No SSR on demand except the contact form Worker.
- SvelteKit scoped styles handle component-level CSS. Global styles use `@layer` (see ADR-0007).
- MDsvex is added as a preprocessor to allow Svelte components inside portfolio case study Markdown files (see ADR-0009).
- The three-tier token architecture uses base, semantic, and component tiers (see ADR-0006).
- Replacing Bootstrap + FontAwesome SVG+JS with bespoke CSS and inline SVG removes two sources of third-party runtime code. Fewer external scripts means a narrower attack surface and a stricter Content Security Policy (see ADR-0003).
