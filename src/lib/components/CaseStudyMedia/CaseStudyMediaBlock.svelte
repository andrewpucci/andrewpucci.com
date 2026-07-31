<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    reverse?: boolean;
    media?: Snippet;
    children?: Snippet;
  }

  let { reverse = false, media, children }: Props = $props();
</script>

{#snippet mediaPane()}
  <div class="case-study-media-block__media">
    {#if media}
      {@render media()}
    {/if}
  </div>
{/snippet}

{#snippet bodyPane()}
  <div class="case-study-media-block__body">
    {#if children}
      {@render children()}
    {/if}
  </div>
{/snippet}

<!-- `reverse` swaps DOM order rather than flipping the grid visually, so focus
     order keeps following the visual reading order (ADR-0002). -->
<div class:case-study-media-block--reverse={reverse} class="case-study-media-block">
  {#if reverse}
    {@render bodyPane()}
    {@render mediaPane()}
  {:else}
    {@render mediaPane()}
    {@render bodyPane()}
  {/if}
</div>

<style>
  .case-study-media-block {
    display: grid;
    gap: var(--space-3);
    margin-block: var(--space-3);
  }

  @media (min-width: 62rem) {
    .case-study-media-block {
      grid-template-columns: 1fr 1fr;
      align-items: center;
    }
  }
</style>
