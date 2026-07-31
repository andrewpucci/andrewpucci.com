<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    reverse?: boolean;
    media?: Snippet;
    children?: Snippet;
  }

  let { reverse = false, media, children }: Props = $props();
</script>

<div class:case-study-media-block--reverse={reverse} class="case-study-media-block">
  <div class="case-study-media-block__media">
    {#if media}
      {@render media()}
    {/if}
  </div>

  <div class="case-study-media-block__body">
    {#if children}
      {@render children()}
    {/if}
  </div>
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

    .case-study-media-block--reverse {
      direction: rtl;
    }

    .case-study-media-block--reverse > * {
      direction: ltr;
    }
  }
</style>
