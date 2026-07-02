# ADR-0011: Image pipeline: @sveltejs/enhanced-img

Date: 2026-07-01
Status: Accepted

## Context

No earlier ADR specifies an image-optimization approach; ADR-0004 through ADR-0010 focus on the framework, hosting, and design-system pieces of the migration. The plan for this migration deliberately deferred the decision until there was real Lighthouse data to justify it, rather than adding a build-time dependency speculatively.

Once routes and content loading were in place, a Lighthouse run against every route showed exactly the failure the deferred decision anticipated: LCP between 5.0s and 5.9s on the home page, portfolio index, and case study pages (ADR-0001 sets a 2.5s ceiling), all traceable to the largest-contentful-paint element being an unoptimized source image (a 114KB hero JPEG, portfolio card screenshots up to 2MB, case study hero images) served at full resolution with no responsive sizing or modern format.

## Decision

Use `@sveltejs/enhanced-img`. It handles both cases this site needs:

- **Statically-known images** (the home hero background, the nav avatar, testimonial photos) via `<enhanced:img src={import('./x.jpg?enhanced')}>` or a direct `?enhanced` import.
- **Data-driven images** (portfolio card screenshots from `cards.json`'s `imgSrc`, case study hero images from frontmatter's `hero` field) via `import.meta.glob('...', { eager: true, query: { enhanced: true } })`, resolving the runtime string path to the matching glob-loaded module. `src/lib/utils/portfolio-images.ts` is the one place this lookup lives; `PortfolioCard.svelte` and the case study `[slug]/+page.svelte` both call it.

Every optimized image moved from `static/img/` (copied verbatim, unprocessed) to `src/lib/assets/img/` (processed by Vite). `static/` still holds truly static assets (favicon, PDFs, robots.txt) and the inline case-study body images that this decision doesn't cover yet (see Consequences).

## Alternatives considered

**`vite-imagetools` directly.** This is what the migration plan tentatively named as the fallback, since `@sveltejs/enhanced-img` was assumed (correctly, for the common case) to require statically-known paths. It turns out `@sveltejs/enhanced-img` supports the same `import.meta.glob` + `?enhanced` pattern directly, and `@sveltejs/enhanced-img` is itself built on top of `vite-imagetools` internally. Using `enhanced-img` for everything means one dependency instead of two, and it's officially maintained by the Svelte team (part of the `sveltejs/kit` repo) rather than a third-party package scoring 3.9 on OpenSSF Scorecard, which would have needed the same documented-exception treatment as MDsvex and Terrazzo (ADR-0003).

**Doing nothing (serve original-size images).** This was the actual default coming out of the routes-and-content-loading phase, and it's what produced the failing Lighthouse numbers above. Ruled out by the data ADR-0001 already requires collecting.

## Consequences

- `vite.config.ts` adds `enhancedImages()` to the plugins array, before `sveltekit()` (it's a preprocessor that needs to see `<enhanced:img>` tags before Svelte compiles the file).
- Images requiring optimization live in `src/lib/assets/img/`, not `static/img/`. Anything referenced only by a literal path string in `static/` (PDFs, robots.txt, favicon) stays there.
- Measured effect: LCP across all tested routes dropped from a 5.0-5.9s range to 1.7-2.4s. All ADR-0001 thresholds pass post-optimization (performance, best-practices, and SEO categories ≥90; LCP ≤2.5s; CLS ≤0.1; TBT, the lab proxy used for the INP threshold since INP is a field metric a single Lighthouse run can't produce, ≤200ms).
- **Not yet covered**: the inline body images within each case study's MDsvex content (the `ExpandableImage` galleries) still reference `static/img/portfolio/*` directly and aren't run through `enhanced-img`. They're below the fold and don't affect any tested LCP element, so this wasn't blocking, but converting them is a natural follow-on once the deferred design pass on the 5 unstyled case studies happens -- both touch the same files.
- Fixed a related but separate bug found via the same Lighthouse run: the resume page failed its CLS threshold (0.153, vs a 0.1 ceiling) from web font swap, not images -- `font-display: swap` on the self-hosted IBM Plex Sans faces was reflowing the page's most text-heavy route when the custom font loaded in. Changed to `font-display: optional` (self-hosted, same-origin, so the font is almost always ready in time; skips the swap entirely on the rare case it isn't, rather than reflowing).
