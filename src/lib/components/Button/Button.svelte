<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';

  type SharedProps = {
    variant?: 'primary';
    children: Snippet;
    onclick?: (event: MouseEvent) => void;
  };

  type Props = SharedProps &
    (
      | ({ href?: undefined } & Omit<HTMLButtonAttributes, 'onclick'>)
      | ({ href: HTMLAnchorAttributes['href'] } & Omit<HTMLAnchorAttributes, 'href' | 'onclick'>)
    );

  let { variant = 'primary', href, children, onclick, ...rest }: Props = $props();
</script>

{#if href}
  <a class="button button--{variant}" {href} {onclick} {...rest as Omit<HTMLAnchorAttributes, 'href'>}>
    {@render children()}
  </a>
{:else}
  <button class="button button--{variant}" {onclick} {...rest as HTMLButtonAttributes}>
    {@render children()}
  </button>
{/if}

<style>
  .button--primary {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
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
