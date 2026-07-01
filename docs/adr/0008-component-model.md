# ADR-0008: Component model: src/lib + Storybook + Chromatic

Date: 2026-06-29
Status: Accepted

## Context

The portfolio is meant to demonstrate design system ownership at a principal level, not just describe it. The components that make up the site should be documented, isolated, accessible, testable, and visually regression-tested. That requires a component library structure and a story-based development workflow.

## Decision

Components live in `src/lib/components/`. Routes consume them. Storybook runs against the same files. Chromatic publishes the Storybook and runs visual regression on every push.

Two categories belong in `src/lib/`:

**Primitive components.** Content-agnostic UI. Button, Card, Badge, form inputs. Would make sense in any Svelte project. All get stories.

**Content components.** Know about portfolio data shapes but appear in more than one route. ResumeEntry, TestimonialQuote, PortfolioCard. These also get stories, with representative example data.

Page sections (Hero, Nav, Footer) are route-specific. They live in `src/routes/` and don't get stories. The line: if a component could be dropped into a different Svelte project and still make sense, it goes in `src/lib/`. If it only makes sense in the context of this portfolio, it stays in routes.

## Alternatives considered

**Monorepo with a separate design system package.** Adds package resolution, publish steps, and version management for a project with one consumer. Not worth the overhead at this scale.

**Storybook as local-only dev tooling.** No public URL, no visual regression. The design system work becomes invisible to people evaluating the portfolio. It defeats the purpose.

**Self-hosted Storybook on a Cloudflare Pages subdomain** (e.g., `design.andrewpucci.com`). Same cost as Chromatic ($0). Requires building visual regression tooling separately. Chromatic provides that for free on the open source plan.

## Consequences

- The Storybook URL is a deliverable, not just a dev tool. It's linkable from the portfolio.
- Chromatic free tier is 5,000 snapshots/month. The repo is public and likely qualifies for the open source plan, which has unlimited snapshots.
- Visual regression runs on every push via GitHub Actions + Chromatic CI.
- A component without a story has no behavioral tests (see ADR-0010).
