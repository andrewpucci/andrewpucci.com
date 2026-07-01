# ADR-0007: CSS architecture: @layer

Date: 2026-06-29
Status: Accepted

## Context

Bootstrap handled cascade management through carefully tuned specificity across its component system. Without Bootstrap, that problem needs an explicit solution. Without one, global styles and Svelte scoped styles will conflict in unpredictable ways as the component library grows.

## Decision

Global CSS uses named `@layer` blocks with an explicit cascade order declared upfront:

```css
@layer reset, tokens, base, components, utilities;
```

**`reset`.** Minimal CSS reset. Sets `box-sizing: border-box`, removes default margins, handles `font-family` inheritance. Nothing opinionated.

**`tokens`.** Terrazzo output. CSS custom properties on `:root`. Custom properties don't participate in the cascade, but including them in the layer order makes the architecture readable.

**`base`.** Base HTML element styles. `body` font settings from DESIGN.md, heading scale, `<a>` defaults, blockquote treatment.

**`components`.** Global component styles that can't live in Svelte scoped styles. Rare.

**`utilities`.** Utility classes, if any are needed. Kept minimal; Svelte scoped styles handle component-specific overrides.

Svelte scoped styles are not in a layer. They automatically win over any layered global style without needing high specificity. That's the right default: a component's own styles should beat global base styles.

## Alternatives considered

**No layers, manage specificity manually.** Works for small projects. Breaks down as global styles and the component library grow. The mental overhead isn't worth it.

**Tailwind CSS.** Utility-first approach that sidesteps the cascade by avoiding global styles almost entirely. Doesn't fit a project where the design system and its token pipeline are the artifact. Bespoke CSS using generated custom properties is a better demonstration of the architecture.

## Consequences

- `@layer` is supported in all modern browsers.
- The cascade order is explicit and auditable. Any developer reading the root CSS file can see which layer wins.
- Adding new global styles means deciding which layer they belong to, which is a useful forcing function.
- Bootstrap specificity quirks are gone. There's no framework-level specificity to fight.
