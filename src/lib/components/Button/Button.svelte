<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  interface Props extends HTMLButtonAttributes {
    variant?: 'primary';
    children: Snippet;
  }

  let { variant = 'primary', children, ...rest }: Props = $props();
</script>

<button class="button button--{variant}" {...rest}>
  {@render children()}
</button>

<style>
  .button--primary {
    cursor: pointer;
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
