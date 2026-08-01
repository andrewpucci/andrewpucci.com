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

## Amendments

- **`:global()` is unlayered, so it beats every layer — including `utilities`.** This ADR notes that Svelte scoped styles sit outside the layer order and therefore win against layered globals. The same is true of a `:global()` rule written inside a component, and that consequence is sharper than it first looks: such a rule outranks `@layer utilities` no matter how the cascade order is written. `ExpandableImage` hit this concretely. It carried its own copy of the `.visually-hidden` declarations under a component-specific class, and swapping in the real utility only worked because the component's competing rule was deleted in the same change. Had both survived, the unlayered component rule would have silently beaten the layered utility and left an accessible-name element visible on screen. **Never redefine a utility inside a component.** If a utility isn't doing the job, fix it in `utilities`.
- **Prefer eliminating `:global()` over naming around it.** A class handed to a child component (`<Card class="…">`, `<Dialog.Trigger class="…">`) lands in that child's scope, not the caller's, so it can only be styled globally. That is a real constraint, but usually an avoidable one. Bits UI components support render delegation through a `child` snippet: the caller renders the element and spreads the component's props onto it, which puts the element back in the caller's scope where ordinary scoped styles reach it. This works even through `Dialog.Portal` — verified in a browser, where the portalled content element carries the component's Svelte scope hash and resolves its scoped positioning and shadow. Where the child renders its own element and delegation isn't available, pass the declaration as a `style` prop rather than reaching across the boundary with a class.
- **Where `:global()` is unavoidable, use the contained form.** `.local-class :global(.thing)` bounds the rule to the component's own subtree, because the leading selector is still scoped; bare `:global(.thing)` applies document-wide and is namespaced by convention alone. The legitimate remaining cases are all content rendered by something else: MDsvex output styled from `src/routes/portfolio/[slug]/+page.svelte`, and slotted link markup in `Footer.svelte`. Bare `:global()` should not appear in a component.
- **No BEM.** Svelte's compile-time scope hash is the namespace, which makes a `component-name__element` prefix redundant inside a scoped `<style>` block — it restates what the compiler already guarantees, and it inflates every selector to carry information the tooling supplies for free. Use plain semantic names (`.media`, `.title`, `.track`) and Svelte's `class:` directive for modifiers (`class:instant`) rather than `--modifier` suffixes. This applies to scoped styles; genuinely global names, such as the utilities in `app.css`, still need to read as global.
- **The `components` layer is declared but empty.** It is kept in the cascade order deliberately. The styles it was created for — component styles that can't live in a Svelte `<style>` block — turned out to be reachable by `child` snippets and contained `:global()` instead, both of which keep a component's styles colocated with its markup. Colocation is worth more here than layer membership, so the layer stays empty by default: use it only for a global component style with no owning component, and prefer the mechanisms above.
