# ADR-0009: Content modeling

Date: 2026-06-29
Status: Accepted

## Context

The site has two types of content with different needs. Resume entries, speaking history, and education records are structured, short, and frontmatter-heavy. Portfolio case studies are narrative-driven and benefit from rich, interactive content when the subject is the design system itself.

## Decision

**Structured content** (resume entries, speaking, education, volunteering, portfolio card metadata, author info): plain Markdown with frontmatter, loaded at build time via `import.meta.glob()`. TypeScript interfaces define the schema. Validated at build time, not runtime.

**Portfolio case studies**: MDsvex. Allows Svelte components to be embedded directly inside Markdown. A case study can include a live component demo, a before/after interaction, or an interactive accessibility example pulled from `src/lib/`. The case study demonstrates the work rather than just describing it.

## Alternatives considered

**Plain Markdown for everything.** Simpler. Sufficient for the resume. Not sufficient for case studies that should show the design system in context.

**A headless CMS** (Contentful, Sanity, etc.). Adds an external dependency, credentials to manage, and API calls at build time for content that changes a few times a year. The content lives just as well in the repo.

**Astro Content Collections.** Zod-validated, type-safe schemas for content with automatic type inference. The right choice if the project were in Astro. Not available in SvelteKit, so TypeScript interfaces with `import.meta.glob()` do the same job.

## Consequences

- MDsvex is added as a preprocessor in `svelte.config.js`. Case study pages use the `.svx` or `.md` extension depending on whether they embed components.
- `import.meta.glob()` loads structured Markdown files at build time. Frontmatter is typed against TypeScript interfaces in `src/lib/types/`.
- Any component in `src/lib/` can be imported and rendered inside a case study page. This is the main payoff of choosing MDsvex over plain Markdown.
- Resume entries and other structured data stay simple: one Markdown file per entry, frontmatter fields match the TypeScript interface.
- MDsvex scored 3.1 on OpenSSF Scorecard, low enough to require the exception process described in ADR-0003. Accepted as a documented exception there.
