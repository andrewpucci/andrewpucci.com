# Product

## Register

brand

## Users

Hiring managers and design leads at enterprise tech companies (B2B software, cybersecurity, healthcare) evaluating candidates for principal IC, design engineering, or design systems roles. They arrive with one of two questions: can this person lead design at the principal level, or can this person be the design-engineering voice on a product team? Both audiences scan quickly. They're looking for evidence of judgment, not just output, and they can tell the difference between someone who works alongside engineers and someone who hands off and waits.

Secondary audience: engineering leads or design systems leads looking for a collaborator who can own a design system end-to-end, from Figma tokens through TypeScript implementation.

## Product Purpose

Personal portfolio for Andrew Pucci, Principal UX Designer at Expel. Current work: end-to-end ownership of the Expel Design System (EDS), from Figma component design through TypeScript implementation, token architecture, accessibility engineering, and build pipeline.

The site needs to carry one story: a designer who builds things. Ships TypeScript, writes AST tooling, manages rebrand migrations, advises product teams on accessibility. Not a designer who makes wireframes and hands off.

The site is also an exhibit of that work in progress. The goal is to build this portfolio's design system the same way Andrew builds EDS at Expel: tokens defined in DTCG format, built with Terrazzo, generating CSS custom properties used throughout. Bootstrap is the current foundation; moving away from it is part of the work, not incidental to it.

Success means a hiring manager finishes reading and believes Andrew can operate at principal level. Design judgment shows up in how the work gets built, not just what gets designed.

Secondary function: professional presence for the UX and design-engineering community (conference speaking, open-source projects, peer credibility).

## Brand Personality

Confident, thoughtful, grounded.

The site should feel like a principal practitioner's work, not a showpiece and not a résumé stapled to a background photo. The open-source projects, the design system ownership, the case studies, and the community involvement earn the confidence. The visual system matches it, rather than announcing it.

## Anti-references

- **Generic Bootstrap portfolio.** Default components, recognizable grid, nothing that reads as an intentional design decision. The site should not look like it came out of a theme.
- **Behance / Dribbble shot gallery.** Image grids arranged for visual impressiveness, thin on process and narrative. A hiring manager at an enterprise company won't trust it.
- **Corporate about-us page.** Formal tone, institutional distance, feels like HR wrote it. Works against the human warmth that differentiates Andrew's style.
- **Trendy agency / creative studio.** Scroll-jacked type reveals, maximalist visual experiments, animation as personality substitute. Signals attention to trend over craft.
- **Portfolio that doesn't reflect current work.** Work that stops at the last big case study with nothing from the past several years. Commercial work is often under NDA; open-source projects and design system work can carry recency regardless.

## Design Principles

1. **Work first, ornamentation second.** The case studies, open-source projects, and design system work carry the page. Visual choices must amplify the content, not compete with it.
2. **Earned authority, not declared.** No section should tell visitors Andrew is experienced; the evidence does. That evidence includes engineering work (shipped TypeScript, open-source tools) alongside design artifacts. Hierarchy and composition signal confidence without self-congratulation.
3. **A person, not a brand.** Warmth, mentorship, and community are real differentiators. The voice and visual system should feel human, not institutional or self-promotional.
4. **Craft as proof of concept.** This is a designer's site; loose ends are self-defeating. Contrast ratios, spacing, type hierarchy, interactive states, and keyboard behavior must be held to a higher standard than a non-designer's portfolio. The design system architecture (token pipeline, component decisions, accessibility) is part of the craft on display.
5. **Accessibility is a design constraint, not a compliance step.** Color is not the sole carrier of meaning. Focus states are visible. Motion respects user preferences. These aren't post-hoc additions; they're built into how components are designed from the start. The site should demonstrate the same approach Andrew takes at Expel: accessibility as part of the design API, not a checklist at the end.
6. **Scannable for busy decision-makers.** Enterprise hiring managers evaluate quickly. Information hierarchy and navigation should make it trivially easy to find the relevant work and move to the next step.

## Accessibility & Inclusion

Accessibility is a core feature of the work here, not a compliance step added at the end. Andrew's practice at Expel includes rejecting component libraries on keyboard-accessibility grounds, getting accessibility requirements into designs before they harden, and closing a11y defects in code review. The same posture applies to this site.

WCAG 2.1 AA minimum throughout. Color is never the sole carrier of meaning. Focus states are visible and high-contrast. `prefers-reduced-motion` is respected. Keyboard navigable throughout. Sufficient contrast on Precision Pink against both white text and the near-white body background.
