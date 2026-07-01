<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAnchorAttributes, HTMLAttributes } from 'svelte/elements';

  interface Props extends HTMLAttributes<HTMLElement> {
    /** When set, the whole card is a link (a real <a>, not a div with a click handler). */
    href?: HTMLAnchorAttributes['href'];
    children: Snippet;
  }

  let { href, children, class: className, ...rest }: Props = $props();
</script>

{#if href}
  <a class="card {className ?? ''}" {href} {...rest}>
    {@render children()}
  </a>
{:else}
  <div class="card {className ?? ''}" {...rest}>
    {@render children()}
  </div>
{/if}

<style>
  .card {
    display: block;
    color: inherit;
    text-decoration: none;
    background: var(--card-background);
    border: 1px solid var(--card-border-color);
    border-radius: var(--card-radius);
    padding: var(--card-padding);
  }
</style>
