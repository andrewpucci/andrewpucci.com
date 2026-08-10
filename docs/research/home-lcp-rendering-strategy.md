# Home-page LCP rendering strategy

Date: 2026-08-06

## Question

What current techniques are most likely to bring the home page's Lighthouse LCP from roughly 2.685 seconds below the 2.5-second budget, given that the hero image is already discoverable in the initial HTML, has `fetchpriority="high"`, and transfers quickly?

## Executive finding

The next useful target is the critical rendering path, not another image framework. The current report already gives the hero request full marks for discovery and priority, while the page reaches FCP at about 1.85 seconds and loads five render-blocking stylesheets. The best low-risk product experiment is `content-visibility: auto` plus native image lazy loading for the clearly below-the-fold home sections. Critical-CSS inlining is also evidence-based, but this repository's earlier `kit.inlineStyleThreshold` spike did not change the Cloudflare-prerendered HTML, so it must be treated as a verified build-output experiment rather than an assumed fix.

The measurement architecture should change in parallel. Keep Lighthouse as a regression signal, but reserve an absolute 2.5-second merge gate for a stable runner or real-user p75 data. The 2.5-second Core Web Vitals threshold is defined for at least 75% of real page visits; Lighthouse itself warns that free, shared CI environments are volatile.

The apparent mismatch between a roughly 2.685-second LCP and roughly 150 milliseconds of LCP subparts is also explained by Lighthouse itself: under simulated throttling, the headline metric is simulated but the current LCP breakdown durations are observed. The Lighthouse team tracks the confusing presentation as [issue #16769](https://github.com/GoogleChrome/lighthouse/issues/16769). It is not evidence that the remaining 2.5 seconds occurred inside an unidentified application task.

## Current evidence

The recent home-page report shows:

- LCP: approximately 2.685 seconds in GitHub Actions, against a 2.5-second budget.
- FCP: approximately 1.85 seconds.
- LCP element: `main#main-content > section.hero > picture > img.image`.
- LCP image: present in the initial HTML, eager, and `fetchpriority="high"`; its transfer is only about 21–31 KB and took about 79 milliseconds in the cited CI run.
- TBT: 0 milliseconds. A local representative report recorded only about 230 milliseconds of observed main-thread work, including about 85 milliseconds of style/layout and 61 milliseconds of script evaluation.
- Five render-blocking CSS files on the home route. In the current production build their uncompressed sizes are approximately 10.5 KB, 1.6 KB, 0.7 KB, 0.7 KB, and 0.6 KB. Lighthouse estimates about 150 milliseconds of FCP savings from eliminating the blocking requests.
- Eighteen initial JavaScript requests are preloaded at high priority, totaling roughly 87 KB transferred. This is a possible source of bandwidth contention, but the 0-millisecond TBT means there is no evidence of a long JavaScript task blocking LCP.
- Several testimonial and portfolio images below the mobile fold are fetched at low priority during the initial load.

Google's current LCP guidance says all four LCP parts must be considered and explicitly warns that reducing an already-fast image transfer can merely move time into render delay rather than improve the final metric. It recommends reducing or inlining render-blocking CSS when a stylesheet prevents the LCP element from rendering. See [Optimize Largest Contentful Paint](https://web.dev/articles/optimize-lcp).

## Ranked recommendations

### 1. Separate the regression gate from the user-experience target

Keep the five-run Lighthouse median and its reports, but do not equate that one GitHub-hosted synthetic profile with the site's Core Web Vitals status. Use it to reject material regressions against an established baseline. Measure the absolute 2.5-second goal with production p75 RUM, or move the absolute lab gate to a stable dedicated/hosted test environment.

Why it ranks first:

- The threshold itself is a field threshold: Google's current guidance defines good LCP as 2.5 seconds or less for at least 75% of page visits.
- Lighthouse explicitly says free CI and burstable machines are volatile, client contention has a high impact, and simulated throttling only partially mitigates it.
- The current local/CI disagreement and the four CI samples clustered around 2.68 seconds are exactly the kind of environment-dependent result for which a trend or baseline comparison is more actionable than a hard universal cutoff.

This is not a recommendation to weaken performance accountability. A practical two-tier system is:

1. PR CI: five serial samples, retain reports, and fail on a statistically meaningful regression from the base branch (plus deterministic resource-size and non-performance assertions).
2. Production: monitor mobile and desktop p75 LCP, CLS, and INP through CrUX when traffic permits or Cloudflare Web Analytics/RUM, and keep 2.5 seconds as the user-facing LCP objective.
3. Diagnostic: when CI regresses, rerun the affected route with applied/DevTools throttling or WebPageTest so trace timings and reported timings can be interpreted directly.

### 2. Skip below-the-fold rendering and fetching

Apply `content-visibility: auto` to the testimonials and portfolio sections, paired with measured `contain-intrinsic-size: auto <size>` placeholders. Add `loading="lazy"` to testimonial avatars and portfolio-card images that are below the initial viewport.

`content-visibility: auto` lets the browser omit style, layout, and paint work for off-screen subtrees while keeping them in the DOM and accessibility tree. `contain-intrinsic-size` reserves an estimated size so the optimization does not cause scrollbar or layout jumps. The feature is available across current major browser engines. See [web.dev's content-visibility guide](https://web.dev/articles/content-visibility) and the [CSS property reference](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/content-visibility).

Why it is the first product change:

- It targets the report's style/layout work with a small, local CSS change.
- It preserves server-rendered content, find-in-page, and accessibility semantics.
- Lazy loading the associated images removes low-priority below-the-fold transfers instead of competing for the initial connection.

Limits and risks:

- `content-visibility` does not by itself stop JavaScript download, hydration, or image fetching; native lazy loading is a separate change.
- The intrinsic-size estimate needs to be tested at mobile and desktop widths to avoid scroll-position changes.
- Focus navigation, find-in-page, carousel controls, and Argos screenshots should be exercised because the browser may render a skipped subtree just before it becomes visible.
- Do not apply it to the hero or the first visible icon content.

### 3. Experiment with critical CSS, verifying the deployed output

Run a controlled experiment with `kit.inlineStyleThreshold` high enough to include the largest home-page stylesheet (the current build needs a value above 10,469 UTF-16 code units; `12_000` is a reasonable starting point), then inspect the actual Cloudflare-prerendered HTML before benchmarking it.

SvelteKit provides this option specifically to merge qualifying page CSS into a `<style>` block in the document head. Its documentation says this reduces initial requests and can improve FCP, with the tradeoff of larger HTML and less effective CSS caching. See [`inlineStyleThreshold`](https://svelte.dev/docs/kit/configuration#inlineStyleThreshold).

Why it remains promising:

- It directly addresses the report's only concrete estimated FCP opportunity.
- It replaces five render-blocking round trips with bytes in the already-required HTML response.
- The total CSS involved is modest for a static portfolio page.
- It uses a supported SvelteKit feature rather than introducing a custom critical-CSS extractor.

Why it does not rank first: an earlier spike in this branch still found linked stylesheets in the Cloudflare prerendered output. That could be an output-inspection mistake, an adapter/build interaction, or a SvelteKit behavior that needs further diagnosis, but it means the documented option cannot yet be credited with removing these requests here. If the generated HTML does not inline the styles, stop and diagnose that behavior before considering a custom critical-CSS transform.

Risks and validation:

- The HTML response grows and repeat visits cannot reuse the inlined CSS independently. SvelteKit explicitly documents that caching tradeoff.
- Because the threshold is global, inspect representative route HTML sizes, not only `/`.
- Compare at least five production-preview Lighthouse runs before and after, and retain the reports. Confirm that CSP hashes continue to be emitted correctly for prerendered pages.
- If inlining all page CSS does not materially improve LCP, revert it rather than keeping extra HTML solely to satisfy a synthetic score.

Vite already splits component CSS and automatically preloads direct imports; adding another general-purpose CSS optimizer would duplicate framework behavior. See [Vite CSS code splitting and preload generation](https://vite.dev/guide/features.html#css-code-splitting).

### 4. Reduce initial JavaScript only if profiling justifies it

The home page statically imports the carousel and the global navigation imports `bits-ui`; SvelteKit/Vite consequently preload the route's dependency graph. SvelteKit recommends dynamic `import(...)` for code needed only under a condition and notes that preloading can hurt when it downloads too much unnecessarily. See [SvelteKit performance: selective loading](https://svelte.dev/docs/kit/performance#reducing-code-size-selective-loading) and the [`resolve` preload filter](https://svelte.dev/docs/kit/hooks#Server-hooks-handle).

The safer structural investigation is:

1. Use the bundle visualizer and a performance trace to attribute the initial chunks.
2. Consider replacing the global menu dependency with a smaller progressive-enhancement or native-disclosure implementation, while preserving its keyboard and screen-reader behavior.
3. Only then test route-specific suppression of nonessential JavaScript preloads. Measure the cost to hydration and time-to-interactive as well as LCP.

Do not jump directly to a home-grown "partial hydration" wrapper. SvelteKit's supported `csr` switch is page/layout scoped: disabling it ships no client JavaScript, removes Svelte component scripts, and turns navigation into full-page loads. See [SvelteKit page options: `csr`](https://svelte.dev/docs/kit/page-options#csr). A dynamic import can split a component, but preserving the carousel's SSR content and then enhancing it later would require a separately designed static fallback and careful state/DOM handoff. That is a much larger accessibility and maintenance change, and the current 0-millisecond TBT does not justify it yet.

### 5. Make one final, bounded hero-image experiment

Keep `@sveltejs/enhanced-img`; it is the SvelteKit-native build-time image pipeline and already produces AVIF/WebP variants, intrinsic dimensions, and responsive sources. SvelteKit's own guidance is to use accurate `sizes`, explicit custom widths when the defaults are too large, `fetchpriority="high"`, and no lazy loading for an LCP image. See [SvelteKit images](https://svelte.dev/docs/kit/images).

Because this image is blurred, grayscale, and low-opacity, a hero-specific source capped to the actual required resolution and encoded at a lower quality is visually defensible. An explicit 400/720-pixel width set could reduce the current 1440-pixel AVIF from about 21 KB to the existing 720-pixel variant's roughly 6 KB. Measure it, but expect only an incremental gain: the current resource duration is not the dominant problem.

Do not:

- switch the LCP image to a CSS background, which makes discovery later unless it is separately preloaded;
- lazy-load it;
- add another image CDN or library solely for this static, build-time-known asset.

Those choices contradict the browser discovery path that already passes and can add latency or operational complexity without addressing FCP.

## Fonts and priority

The current self-hosted WOFF2 font, metric-compatible fallback, `font-display: optional`, and one explicit preload are broadly aligned with current guidance. SvelteKit deliberately does not preload every font and advises selective font preloading and subsetting; web.dev warns that too many preloads dilute priority and cause contention. See [SvelteKit font performance](https://svelte.dev/docs/kit/performance#optimizing-assets-fonts) and [Preload critical assets](https://web.dev/articles/preload-critical-assets).

The prior no-preload experiment did not materially improve the home LCP, so font changes should not be the next optimization. Keep the preload count to one, retain WOFF2 and `font-display: optional`, and revisit only if a trace shows it delaying the hero or CSS.

## CI and measurement architecture

Treat the 2.5-second value as the user-experience goal, but do not treat one synthetic environment as the field Core Web Vitals assessment.

1. **Keep the five-run aggregate.** Lighthouse's own variability guide says the median of five runs is about twice as stable as a single run and recommends aggregate thresholds. It also warns that free CI and burstable machines are volatile. See [Lighthouse variability](https://github.com/GoogleChrome/lighthouse/blob/main/docs/variability.md).
2. **Keep simulated Lighthouse for regression detection, not causal timing.** Simulated throttling extrapolates a page load from an unthrottled trace. Lighthouse documents inherent edge-case inaccuracy and recommends applied/DevTools or packet-level throttling for deep investigation. See [Lighthouse throttling](https://github.com/GoogleChrome/lighthouse/blob/main/docs/throttling.md).
3. **Add an applied-throttling diagnostic path.** For failed PRs, retain the LHR plus trace and rerun the home route with `throttlingMethod: "devtools"`. In that mode the trace timings match Lighthouse's reported values, which makes the critical path debuggable. This run will be more variable, so it should initially inform diagnosis rather than become another hard gate.
4. **Use a stable performance environment for an absolute gate.** If 2.5 seconds must block merges, use a dedicated runner or a hosted lab such as PageSpeed Insights/WebPageTest rather than assuming GitHub-hosted runner timing is invariant.
5. **Measure the actual production population at p75.** Core Web Vitals are field metrics and the 2.5-second LCP threshold is defined at the 75th percentile, segmented between mobile and desktop. Lab data is excellent for debugging and pre-release regression testing, but it represents one controlled scenario. See [lab versus field data](https://web.dev/articles/lab-and-field-data-differences), [Core Web Vitals workflows](https://web.dev/articles/vitals-tools), and [threshold methodology](https://web.dev/articles/defining-core-web-vitals-thresholds).

Because this site is already deployed on Cloudflare, Cloudflare Web Analytics is a low-operational-overhead RUM option. Its Core Web Vitals view reports p75 and identifies LCP elements by route, browser, OS, and country. See [Cloudflare Web Analytics Core Web Vitals](https://developers.cloudflare.com/web-analytics/data-metrics/core-web-vitals/) and [data collection](https://developers.cloudflare.com/web-analytics/data-metrics/data-origin-and-collection/).

The current subpart mismatch should be documented in CI output or the report artifact: Lighthouse's open issue states that LCP subpart durations are observed while the LCP metric is simulated. Therefore, do not subtract the observed subparts from simulated LCP and label the remainder "render delay."

## Recommended sequence

1. Preserve the current five-run reports, add base-branch comparison, and begin collecting production p75 data.
2. Add `content-visibility`/intrinsic sizing and lazy loading to the below-the-fold testimonials and portfolio; validate accessibility, focus, scrolling, and visual snapshots.
3. Test `inlineStyleThreshold: 12_000`, inspect the actual Cloudflare output, and keep it only if it really removes the linked CSS and improves medians without unacceptable HTML growth.
4. Profile the JavaScript dependency graph; simplify the global navigation or design delayed carousel enhancement only if the trace shows that work is material.
5. If more margin is still needed, test a capped, lower-quality 400/720-pixel hero source as a small bandwidth refinement.
6. Add applied-throttling diagnostics so simulated-Lighthouse failures have a trace whose timings can be interpreted directly.

This sequence addresses the strongest current evidence first, keeps the initial changes reversible, and reserves the higher-risk hydration architecture work for a case where measurements show it is necessary.

## Experiment ledger

| Experiment                              | Production-preview result                                                                                                                                                        | Verdict                                                                                                      |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Below-fold containment and lazy loading | Cold applied-throttling LCP remained within noise (3,379ms → 3,387ms), while initial image requests fell from 35 to 29 and the full-DOM layout warning disappeared               | Keep for reduced initial transfer and layout scope; do not claim an LCP improvement                          |
| `inlineStyleThreshold: 12_000`          | Home improved from 2,346ms to 2,114ms, but case-study routes regressed by 220–370ms because the shared 10KB layout stylesheet was duplicated into every HTML response            | Reject the global threshold; the cross-route cost outweighs the home-only win                                |
| `inlineStyleThreshold: 1_000`           | Home retained the improvement at 2,119ms while the worst measured case-study regression fell from about 370ms to 224ms                                                           | Keep; inline only tiny component chunks and leave shared/route CSS cacheable                                 |
| Same-runner base comparison             | Current and base revisions each use five serial Lighthouse runs per route; CI allows `max(250ms, 10%)` above the base median while continuing to report the absolute 2.5s target | Keep the 2.5s value as the production p75 objective; use the relative result as the shared-runner merge gate |
