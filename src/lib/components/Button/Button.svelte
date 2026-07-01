<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';

  type Props = { variant?: 'primary'; children: Snippet } & (
    | ({ href?: undefined } & HTMLButtonAttributes)
    | ({ href: HTMLAnchorAttributes['href'] } & Omit<HTMLAnchorAttributes, 'href'>)
  );

  let { variant = 'primary', href, children, ...rest }: Props = $props();
</script>

{#if href}
  <a class="button button--{variant}" {href} {...rest as Omit<HTMLAnchorAttributes, 'href'>}>
    {@render children()}
  </a>
{:else}
  <button class="button button--{variant}" {...rest as HTMLButtonAttributes}>
    {@render children()}
  </button>
{/if}

<style>
  .button--primary {
    display: inline-block;
    cursor: pointer;
    text-decoration: none;
    font: var(--typography-body);
    color: var(--button-primary-foreground);
    background: var(--button-primary-background);
    border: 1px solid var(--button-primary-background);
    border-radius: var(--button-primary-radius);
    padding-block: var(--button-primary-padding-block);
    padding-inline: var(--button-primary-padding-inline);
  }

  .button--primary:hover,
  .button--primary:focus-visible {
    background: var(--button-primary-background-hover);
    border-color: var(--button-primary-background-hover);
  }

  .button--primary:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
</style>
