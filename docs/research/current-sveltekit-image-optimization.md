# Current SvelteKit image optimization

Researched 2026-08-06 against SvelteKit, Vite, Eleventy, Cloudflare, and Chrome
primary documentation. This answers whether the former Eleventy Image pipeline
offers an advantage for the current SvelteKit site, and what would materially
improve the home-page image LCP.

## Findings

### The current first-party SvelteKit path already matches Eleventy Image

SvelteKit recommends `@sveltejs/enhanced-img` for local build-time assets. It
generates AVIF and WebP alternatives, intrinsic dimensions, multiple responsive
sizes, and strips EXIF data. At build time, `<enhanced:img>` becomes a
`<picture>` with the generated variants. With a `sizes` attribute it emits a
`srcset`, so the browser selects an appropriately sized candidate.

Eleventy Image provides the same essential model: Sharp-backed build-time
processing, multiple widths and formats (including AVIF/WebP), generated
`<picture>`/`<img>` markup, intrinsic dimensions, and caching. It is a good
tool for an Eleventy project, but it has no critical-path capability that
`@sveltejs/enhanced-img` lacks in this SvelteKit project. Replacing the current
pipeline with it would add a second framework-specific image layer without a
likely LCP improvement.

The current home hero already follows the SvelteKit guidance: it is a local
`?enhanced` import rendered in initial HTML with `sizes="720px"`, no lazy
loading, and `fetchpriority="high"`. The build emits 720w and 1440w AVIF,
WebP, and JPEG candidates. The currently generated AVIF candidates are about
5.8 KB (720w) and 21 KB (1440w), compared with the 112 KB source JPEG. This
is already an efficient transfer for an image that is blurred, grayscale, and
30% opaque.

Vite also hashes imported assets, allowing them to be cached effectively. Keep
these images in `src/lib/assets`, rather than moving them to `static/`, so they
remain in the build-time optimization and content-hash path.

### LCP priority and discovery

For an image that is genuinely the LCP candidate, SvelteKit advises
`fetchpriority="high"` and avoiding `loading="lazy"`; both are already true.
Chrome additionally advises keeping the LCP image's `src`/`srcset` in the
initial HTML. A CSS background normally has worse discovery unless it is
preloaded, so moving this image to CSS is not an image-loading optimization.

Chrome separates LCP into time to first byte, resource-load delay, resource
load time, and element-render delay. The recent CI report's hero request was
discovered promptly and loaded in roughly 112 ms, while the overall LCP was
about 2.7 s. That makes the current failure predominantly an element-render or
CI-machine timing problem, rather than a 21 KB image-transfer problem.

### Responsive variants

`sizes="720px"` intentionally permits a 2x-density browser to choose the
1440w candidate. That is correct for a normal 720 CSS-pixel image, but this
particular artwork is decorative and strongly filtered. The only image-specific
experiment worth making is a measured quality trade-off: cap its largest
candidate at 720w (or generate narrower custom widths) and compare visual
quality and five-run median LCP. It may save roughly 15 KB on a high-density
request, but should not be expected to recover a 185 ms budget gap by itself.

Do not add a font/image preload blindly. The current HTML image is already
preload-scanner discoverable and high priority; an extra preload is redundant
and can compete with other critical resources.

### CDN and runtime optimization

Cloudflare Images can resize, compress, and transcode dynamically at the edge,
either from a source origin or Cloudflare-managed storage. It is appropriate
for CMS/user-uploaded/remote images or a large set of runtime variants. For
this small, local, static image set it adds service configuration and cost
without improving the already-built variants; an uncached transform also adds
an origin fetch and transformation before the first response. Retain the
build-time assets served through the existing CDN. Revisit Cloudflare Images
if the portfolio becomes CMS-driven or visitors upload imagery.

## Recommendation

Keep `@sveltejs/enhanced-img` as the site-wide static-image pipeline. It is the
SvelteKit-native equivalent of the former Eleventy Image setup and is already
configured correctly for the hero's formats, responsive selection, layout
stability, discovery, and priority.

Before changing the hero appearance or the Lighthouse budget, run one narrow
A/B test that caps the decorative hero's maximum generated width at 720w and
checks both image fidelity and the existing five-run median. If it does not
move LCP materially, stop image tuning: the audit evidence says the remaining
work is outside image transfer. Expand the existing `enhanced-img` coverage to
the below-the-fold MDsvex gallery assets as a separate bandwidth improvement;
it will not address the home LCP.

## Sources

- [SvelteKit: Images and `@sveltejs/enhanced-img`](https://svelte.dev/docs/kit/images)
- [Vite: Static asset handling](https://vite.dev/guide/assets)
- [Eleventy Image](https://www.11ty.dev/docs/plugins/image/)
- [Chrome: Optimize Largest Contentful Paint](https://web.dev/articles/optimize-lcp)
- [Cloudflare Images: overview](https://developers.cloudflare.com/images/)
- [Cloudflare Images: transformations](https://developers.cloudflare.com/images/optimization/transformations/overview/)
