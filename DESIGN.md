---
name: andrewpucci.com
description: Principal UX designer portfolio: confident, thoughtful, grounded
colors:
  primary: "#d42274"
  body-bg: "#fbfafa"
  surface: "#ffffff"
  ink: "#212529"
  ink-secondary: "#495057"
typography:
  display:
    fontFamily: "'Atkinson Hyperlegible Next Variable', system-ui, -apple-system, sans-serif"
    fontSize: "clamp(1.975rem, calc(1.475rem + 2.7vw), 3.5rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "normal"
  headline:
    fontFamily: "'Atkinson Hyperlegible Next Variable', system-ui, -apple-system, sans-serif"
    fontSize: "clamp(1.375rem, calc(1.175rem + 1.5vw), 2.5rem)"
    fontWeight: 700
    lineHeight: 1.25
  title:
    fontFamily: "'Atkinson Hyperlegible Next Variable', system-ui, -apple-system, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.4
  body:
    fontFamily: "'Atkinson Hyperlegible Next Variable', system-ui, -apple-system, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "'Atkinson Hyperlegible Next Variable', system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.4
rounded:
  sm: "0.25rem"
  md: "0.375rem"
  lg: "0.5rem"
  full: "50%"
spacing:
  "1": "0.28125rem"
  "2": "0.5625rem"
  "3": "1.125rem"
  "4": "1.6875rem"
  "5": "2.53125rem"
  "6": "3.375rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "0.375rem 0.75rem"
  button-primary-hover:
    backgroundColor: "#b31d63"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "0.375rem 0.75rem"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
  nav-link-default:
    textColor: "{colors.ink}"
  nav-link-hover:
    textColor: "{colors.ink-secondary}"
  nav-link-active:
    textColor: "{colors.primary}"
  footer-block:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
---

# Design System: andrewpucci.com

## 1. Overview

### Creative North Star: "The Principal Review"

One saturated accent, large body text, flat surfaces. The design doesn't compete with the content; it makes room for it. Case studies, open-source projects, design system work, and a career history carry the pages.

The primary audience is hiring managers and design leads at enterprise tech companies evaluating principal-level candidates. A secondary audience is engineering leads and design systems leads looking for a collaborator with both design judgment and engineering depth. Both scan before they read. Hierarchy matters more than novelty. Each surface should make the next step obvious, whether that's a case study, a project, or a way to get in touch.

Three aesthetics this explicitly avoids: off-the-shelf Bootstrap defaults (nothing that reads as unconsidered), the Dribbble shot grid (images over narrative), and creative-agency portfolio mode (scroll animation and type reveals as personality substitutes). One brand color, used deliberately. Everything else is structure and text.

Accessibility is a design constraint built into component decisions from the start, not a checklist applied afterward. Color is never the sole carrier of meaning. Every interactive state has a non-color indicator. Every component is keyboard reachable. Motion is conditional on user preference. WCAG 2.1 AA is the floor.

**Key Characteristics:**

- One saturated brand accent; all other surfaces neutral or white
- Single typeface, differentiated by weight only. No second family, no display font.
- Large base type (1.125rem / 18px), set deliberately above the 1rem default common in framework-first sites
- Full-bleed Precision Pink footer as the one committed color surface
- Flat by default; no decorative elevation or shadow
- Accessible by default: visible focus, non-color state indicators, reduced-motion support

### Implementation Direction

The site now runs on a purpose-built token pipeline: DTCG-format tokens built with Terrazzo, generating CSS custom properties used throughout, mirroring the architecture of the Expel Design System (EDS). The site is itself an exhibit of that work in progress.

The constraint remains the same even without Bootstrap in the repo: nothing should read like a framework default or theme preset. Components need deliberate spacing, type, state, and motion choices that reflect the system rather than a starter kit.

## 2. Colors: The Precision Palette

One saturated color. Everything else neutral.

### Primary

- **Precision Pink** (`#d42274`): The sole saturated color. Used on active nav states, CTAs, timeline dot markers, carousel controls, and the footer background. The full-bleed footer works because the color is absent everywhere it doesn't need to be.

### Neutral

- **Ink** (`#212529`): Primary body text, headings, navbar text at rest, and the vertical timeline rule. Near-black, not pure black.
- **Slate** (`#495057`): Secondary text, nav hover states, card subtitles, metadata. Creates a two-step reading hierarchy with Ink without introducing a third color.
- **Surface** (`#ffffff`): Card backgrounds, content areas, modal backgrounds. Pure white against Body Background reads as elevated without a shadow.
- **Body Background** (`#fbfafa`): Page background. Imperceptibly warm near-white, distinct from Surface without reading as cream or paper.

### Color Rules

**The Full-Bleed Commitment Rule.** When Precision Pink appears as a background, it claims the entire surface. The footer is 100% pink with white text. Partial pink panels (a strip down one side, a tinted card background, a faint rose wash) are prohibited. The color either owns the surface or steps aside.

**The One Accent Rule.** Precision Pink marks what matters: the active state, the call to action, the dot that anchors each timeline entry. It doesn't appear on decorative dividers, supporting copy, background washes, or hover treatments on non-interactive elements. If two things on the same screen are pink, one of them is wrong.

**The Non-Color Meaning Rule.** No state change may be communicated by color alone. Active nav links use Precision Pink and a weight or underline change. Focus rings are visible and high-contrast. Error states pair color with an icon or text label.

**The Contrast Floor.** 4.5:1 minimum for body text on all backgrounds. 3:1 for large text (≥18px regular or ≥14px bold). White text on Precision Pink (`#d42274`) clears 4.5:1 and must be verified any time the pink value changes.

## 3. Typography

**Display / Body Font:** Atkinson Hyperlegible Next (self-hosted variable WOFF2 via Fontsource, `font-display: swap`). Weight axis 200-800; the site uses Regular (400) and Bold (700), plus italics. Chosen for the same reason it's used on chroma11y: it's designed to maximize character distinction (1/l/I, disambiguated numerals) over conventional elegance, which matters more on a portfolio a screen-reader or low-vision user is expected to actually read.

**Character:** One family, two weights. Display and body copy are both Atkinson Hyperlegible Next, differentiated by size and weight only. The single-family constraint is intentional, not a gap to fill.

### Hierarchy

- **Display** (700, `clamp(1.975rem, calc(1.475rem + 2.7vw), 3.5rem)`, line-height 1.2): Hero headlines only. Currently the banner call-to-action. Never used for section titles.
- **Headline** (700, `clamp(1.375rem, calc(1.175rem + 1.5vw), 2.5rem)`, line-height 1.25): H1-level page titles and major résumé section names. Fluid; rarely appears outside dedicated header regions.
- **Title** (700, 1.125rem, line-height 1.4): H4-H6 section headings (feature blocks, footer section headers). Matches body size; hierarchy comes from weight, not size escalation.
- **Body** (400, 1.125rem, line-height 1.5): All prose. Max line length 65-75ch on content pages.
- **Label** (700, 0.875rem, line-height 1.4): Navigation links, cite attributions, card metadata. Smaller and bolder for supplementary and navigational text.

### Typography Rules

**The Weight-Only Hierarchy Rule.** One typeface, two weights. Scale and weight carry all hierarchy. Never introduce a second typeface, a display serif, or a monospace style to add variety. The single-family constraint is the point, not a limitation.

**The Large Body Rule.** Body text is 1.125rem (18px). Never reduce it below 1rem for any content meant to be read.

**The Semantic Structure Rule.** Heading levels reflect document outline, not visual size. Interactive elements are buttons or links, not divs with click handlers. Form fields have visible labels. Images have meaningful alt text or explicit `alt=""` when decorative.

## 4. Elevation

Flat by default. Depth comes from color contrast, type weight, and spacing.

Surfaces sit at two levels: Body Background (`#fbfafa`) and Surface (`#ffffff`). Cards read as elevated against the near-white page by color alone, no shadow needed. The navbar is `rgba(255, 255, 255, 0.98)`, separating from content below without a drop shadow.

The one exception is the modal entry animation, which uses a `scale(0.8)` transform as a depth cue rather than shadow. This animation must have a `prefers-reduced-motion` fallback: an instant appearance, not a scaled one.

### Elevation Rules

**The Flat-By-Default Rule.** Shadows don't appear on resting elements. No card hover lifts, no navbar drop shadows, no ambient glows on buttons. If an element needs a shadow to look elevated, the layout, color, or spacing isn't doing its job. Shadows may appear as hover-state feedback on interactive components, as a response to interaction rather than decoration.

**The Motion Preference Rule.** Animations and transitions respect `prefers-reduced-motion: reduce`. The reduced-motion fallback is an instant transition or a simple fade — never a removed affordance. Content does not disappear or become inaccessible for users with motion sensitivity.

## 5. Components

**Visible Focus Rule (applies to all interactive components).** Every interactive element must have a visible focus indicator. Current standard: 2px Precision Pink outline at 2px offset. Never suppress the default focus ring without replacing it with something equally visible.

### Buttons

The primary button is the only variant in the current design.

- **Shape:** 0.375rem (6px) radius
- **Primary:** Precision Pink background (`#d42274`), white text, matching 1px border. Padding 0.375rem x 0.75rem — compact, appropriate for the site's text-heavy layout. Font size inherits from body (1.125rem).
- **Hover / Focus:** Background darkens to `#b31d63` (roughly 10% darker), border matches. Focus: 2px Precision Pink outline at 2px offset. Color response only; no scale or transform.
- **No secondary or ghost variant currently defined.** If added: Ink text on transparent background with an Ink border. A pink ghost button disappears against white.

### Cards

- **Corner Style:** 0.375rem, matching buttons
- **Background:** Surface white (`#ffffff`)
- **Shadow Strategy:** None, per the Flat-By-Default Rule
- **Border:** 1px solid `rgba(33, 37, 41, 0.125)`, barely visible against Body Background
- **Image Treatment:** Top images rendered in full grayscale (`filter: grayscale(100%)`). Project screenshots are artifacts of the work, not the work itself. Grayscale keeps the card grid from competing by color.
- **Internal Padding:** 1.125rem (spacing level 3)

### Navigation

- **Style:** Fixed top, full-width, white at 98% opacity
- **Links:** Ink at rest, Slate on hover, Precision Pink when active. No underlines; color carries the state.
- **Logo:** 42px circular avatar. Signals person, not brand, from the first glance.
- **Mobile:** Collapsed hamburger toggler. Links stack vertically; the primary download button sits below the link list.
- **Typography:** Label weight (700, 0.875rem) to keep the bar lightweight.

### Timeline / Entrylist

Used on the résumé for work, education, speaking, and volunteering.

- **Vertical rule:** 1px Ink line, fading to transparent at the bottom via `linear-gradient`.
- **Entry dot:** 0.625rem Precision Pink circle centered on the rule at the start of each entry heading. The only appearance of Precision Pink in the résumé layout.
- **Entry content:** Title weight (700, 1.125rem) for role name, Slate metadata below, Ink prose below that.

### Footer

- **Style:** Full-width Precision Pink (`#d42274`), the only full-bleed color surface on the site.
- **Text:** White throughout (headings, body copy, links).
- **Links:** White, no decoration at rest, underline on hover.
- **Internal spacing:** 3.375rem (spacing level 6) top and bottom.

## 6. Do's and Don'ts

### Do

- **Do** use Precision Pink for active states, the primary CTA, and the footer background. Nothing else. Scarcity is the point.
- **Do** hold body text at 1.125rem minimum. Never reduce content text below 1rem on any surface.
- **Do** let the case study content, open-source projects, and career history carry pages. Visual restraint is intentional; the work is the product.
- **Do** meet 4.5:1 contrast for body text and 3:1 for large text on all backgrounds. White text on Precision Pink must be verified any time the color value changes.
- **Do** pair every color-based state change with a non-color indicator. Color alone is not enough.
- **Do** include a `prefers-reduced-motion` fallback for every animation. Instant transitions are fine; invisible or inaccessible content is not.
- **Do** render the footer as a full-bleed Precision Pink block. No partial pink panels, no pink strips.
- **Do** apply `filter: grayscale(100%)` to portfolio card images. Grayscale is a system decision, not a placeholder.
- **Do** keep type hierarchy to weight and scale. Atkinson Hyperlegible Next at two weights is the full palette.
- **Do** define new design values as DTCG-format tokens built with Terrazzo. Extend the token pipeline rather than sneaking ad hoc component values back into the codebase.

### Don't

- **Don't** let the site look like it came out of a template. Any element that reads as framework-default or starter-kit UI needs a deliberate choice applied. Generic Bootstrap portfolio is still the primary anti-reference.
- **Don't** reintroduce framework-era variables or utility conventions through the side door. New component styling should use Terrazzo-generated CSS custom properties, not one-off compatibility shims.
- **Don't** turn portfolio pages into a Dribbble shot gallery. Case studies need context, process narrative, and decision rationale. Image grids optimized for visual impressiveness don't do that.
- **Don't** let the tone go corporate. "Want to chat? Get in touch!" is the register. Formal biography copy, third-person references, and achievement-stacking bullet points are not.
- **Don't** introduce scroll-driven animations, type reveals, parallax effects, or motion that signals "creative agency portfolio." Motion should be functional: a state change, a transition, a hover response.
- **Don't** use `border-left` or `border-right` greater than 1px as a colored decorative stripe on cards, callouts, or list items. The current blockquote uses a 9px left border in Precision Pink. That's design debt to resolve, not a pattern to continue. Replace with a background tint, indented padding, or typographic differentiation.
- **Don't** replace Atkinson Hyperlegible Next without deliberate selection from a real type catalog. Don't default to Inter, DM Sans, Space Grotesk, or any other AI-reflex typeface. If a change is needed, choose for the brand.
- **Don't** add color complexity. No secondary accent, no gradient, no multi-color palette. One pink, one near-white, two grays, one surface white.
