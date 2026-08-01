<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    columns?: 2 | 3;
    wide?: boolean;
    children?: Snippet;
  }

  let { columns = 3, wide = false, children }: Props = $props();
</script>

<div
  class:case-study-media-gallery--two={columns === 2}
  class:case-study-media-gallery--three={columns === 3}
  class:case-study-media-gallery--wide={wide}
  class="case-study-media-gallery"
>
  {#if children}
    {@render children()}
  {/if}
</div>

<style>
  .case-study-media-gallery {
    display: grid;
    gap: var(--space-3);
    margin-block: var(--space-3);
  }

  @media (min-width: 48rem) {
    .case-study-media-gallery:not(.case-study-media-gallery--wide).case-study-media-gallery--two {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .case-study-media-gallery:not(.case-study-media-gallery--wide).case-study-media-gallery--three {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (min-width: 62rem) {
    .case-study-media-gallery.case-study-media-gallery--wide.case-study-media-gallery--two {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .case-study-media-gallery.case-study-media-gallery--wide.case-study-media-gallery--three {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
</style>
