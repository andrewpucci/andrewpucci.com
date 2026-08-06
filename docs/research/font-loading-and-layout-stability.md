# Font loading and layout stability

Researched 2026-08-06 using CSS Fonts, MDN, Chrome/web.dev, Fontsource, and
Capsize primary documentation. This applies to the current setup:
`@fontsource-variable/atkinson-hyperlegible-next` is self-hosted by Vite and
its default stylesheet declares normal, Latin and Latin-ext variable WOFF2
faces (`wght` 200–800) with `font-display: swap`. The app uses the family with
the generic fallback `system-ui, -apple-system, sans-serif`. The observed CLS
is therefore consistent with a fallback-to-Atkinson swap changing line breaks
and/or line-box metrics.

## Findings

### `font-display`

CSS Fonts defines `auto`, `block`, `swap`, `fallback`, and `optional`; exact
durations are deliberately user-agent dependent. [Fontsource defaults to
`swap`][fontsource-display]: text is shown immediately in a fallback, then is
replaced whenever the web font finishes. That prevents a long FOIT but can
produce FOUT and a layout shift.

| Value      | Initial experience          | Late-load result                                    | Suitability here                                                                            |
| ---------- | --------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `block`    | Brief invisible text (FOIT) | Uses the web font if it arrives in the block period | Avoid: it trades the current CLS for hidden content.                                        |
| `swap`     | Immediate fallback (FOUT)   | Always swaps later                                  | Keep only with a matched fallback; otherwise it is the direct cause of the observed CLS.    |
| `fallback` | Short block then fallback   | Swap is time-limited                                | A reasonable middle ground, but timing varies by browser.                                   |
| `optional` | Very short block/fallback   | May retain fallback permanently                     | Best for eliminating a late swap; it may leave slow-connection visitors in the system font. |

Chrome documents that preloading a font and using `font-display: optional`
eliminates FOIT and layout jank in Chrome's optimized path. This is a strong
performance choice, but it is also a brand/typography choice: Atkinson is an
accessibility-motivated typeface, so intentionally not using it for a slow
first visit is a real tradeoff. `optional` does not remove the need for a
legible generic fallback.

### Preload

[Fontsource's Vite guidance][fontsource-preload] is to import the exact WOFF2
URL using `?url`, then add a `<link rel="preload" as="font"
type="font/woff2" crossorigin="anonymous">`. It explicitly cautions against
preloading every file because that can delay more important resources and hurt
Core Web Vitals.

For this site, preload at most the normal Latin `wght` WOFF2 that is used in
the initial viewport. Do not preload Latin-ext, italic, or several weights:
the variable normal face already covers weights 200–800, and `unicode-range`
allows the browser to fetch Latin-ext only when needed. Fontsource recommends
the variable package where several weights are used and documents `wght.css`
as the narrowest suitable variable import. Preload improves the chance that
the preferred face paints first; it does not guarantee that the fallback and
web font have identical geometry.

### Fallback metric overrides

CSS Fonts provides four `@font-face` descriptors relevant to stable fallback
layout: `size-adjust`, `ascent-override`, `descent-override`, and
`line-gap-override`. Chrome documents that the three metric overrides make
the fallback's vertical dimensions match the web font; adding `size-adjust`
also improves average line-length matching, reducing horizontal rewraps.

The fallback—not the downloaded Atkinson face—gets a separate family name and
the overrides. Chrome provides the equations:

```text
size-adjust          = web average character width / fallback average character width
ascent-override      = web ascent / (web UPM × size-adjust)
descent-override     = web descent / (web UPM × size-adjust)
line-gap-override    = web line gap / (web UPM × size-adjust)
```

Values must be generated from the actual version of the normal Atkinson Next
Latin WOFF2 and the selected fallback, not guessed or copied from an older
Atkinson font. The CSS Fonts specification notes that native font metric
selection can differ by browser/platform; verify the generated rule in the
Playwright browser matrix. MDN currently marks individual metric descriptors
as not Baseline, so keep the unmodified generic fallback as the progressive
fallback for browsers that do not apply them.

### `font-synthesis`

`font-synthesis` controls whether the browser manufactures a missing bold,
italic, small-caps, subscript, or superscript face. It does **not** disable
designed variable-font axes. Atkinson Next's normal variable face supports
weight 200–800, so synthetic bold is unnecessary for normal text. The current
Fontsource default import does not include the real italic face, however.

`font-synthesis: none` is worthwhile for typographic fidelity only after
loading the actual italic WOFF2 (and maintaining the current variable weight
range). Otherwise it can replace requested italics with an unsuitable fallback
or upright text. It is not a fix for fallback-to-web-font CLS, so it ranks
below metric matching.

### Capsize and metric tooling

[Capsize][capsize] takes real font metadata and produces cap-height based
text sizing plus leading trimming. Its metrics package/tooling can also help
derive fallback metric overrides. It is primarily a typography-layout system,
not a font-loader: applying it changes visual alignment and often adds
pseudo-elements. Capsize cautions that perfect fallback handling has
tradeoffs, fallbacks should have similar cap-height/descender proportions, and
truncation should be applied to a child rather than the capsized element.

For this tokenized site with explicit font sizes and line heights, adopting
Capsize globally is a much larger visual-system change than fixing the swap.
Use its metrics tooling (or direct OpenType table parsing) at build time to
generate the fallback rule; do not add Capsize's runtime/layout output unless
cap-height trimming is independently desired and visually approved.

## Ranked recommendation

1. **Add a generated, static metric-matched fallback face; retain `swap`; then
   preload only normal Latin.** This preserves immediate readable text and
   ensures the preferred Atkinson face is used whenever it can load, while
   addressing both vertical shift and line-wrap changes. It has small CSS and
   verification cost, but must be regenerated if the font or fallback changes.
   This is the best fit for an accessibility-focused body typeface and the
   observed swap CLS.
2. **If measurements still show a late font swap, use preload + `optional` for
   the normal Latin face.** Chrome specifically recommends this pairing to
   eliminate layout jank. Tradeoff: a cold, slow-network visit may remain in
   the system fallback. This is best when stability and fast content outweigh
   guaranteed first-visit typeface identity.
3. **Use `fallback` rather than `swap` only if product prefers a time-bounded
   compromise.** It reduces long-tail late swaps but is less deterministic
   than `optional` and has browser-dependent timing.
4. **Add `font-synthesis: none` after importing the genuine italic face.**
   This protects the font design but does not fix CLS; importing italic adds a
   resource only when italic content requires it.
5. **Adopt Capsize globally only as a separate typography initiative.** It can
   create very precise rhythm and supply metrics, but it risks broad visual
   changes and is disproportionate to this loading-specific defect.

## Sources

- [CSS Fonts Level 4: font display, metric overrides, and synthesis][css-fonts]
- [MDN: `font-synthesis`][mdn-synthesis]
- [Chrome: preload + optional fonts][webdev-optional]
- [Chrome: improved font fallbacks and metric calculations][chrome-fallbacks]
- [Fontsource: display defaults][fontsource-display], [variable fonts][fontsource-variable], and [Vite preload][fontsource-preload]
- [Capsize documentation][capsize]

[css-fonts]: https://drafts.csswg.org/css-fonts/
[mdn-synthesis]: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/font-synthesis
[webdev-optional]: https://web.dev/articles/preload-optional-fonts
[chrome-fallbacks]: https://developer.chrome.com/blog/font-fallbacks
[fontsource-display]: https://fontsource.org/docs/getting-started/display
[fontsource-variable]: https://fontsource.org/docs/getting-started/variable
[fontsource-preload]: https://fontsource.org/docs/getting-started/preload
[capsize]: https://seek-oss.github.io/capsize/
