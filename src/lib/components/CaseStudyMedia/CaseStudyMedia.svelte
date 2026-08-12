<script lang="ts">
  import ExpandableImage from '$lib/components/ExpandableImage/ExpandableImage.svelte';

  interface Props {
    src: string;
    alt: string;
    caption?: string;
    expandable?: boolean;
  }

  let { src, alt, caption, expandable = false }: Props = $props();
</script>

<figure class="case-study-media">
  {#if expandable}
    <ExpandableImage {src} {alt} />
  {:else}
    <img {src} {alt} />
  {/if}

  {#if caption}
    <figcaption>{caption}</figcaption>
  {/if}
</figure>

<style>
  .case-study-media {
    margin: 0;
  }

  .case-study-media img {
    display: block;
    width: 100%;
    border-radius: var(--radius-md);
  }

  .case-study-media figcaption {
    margin-block-start: var(--space-1);
    font-size: var(--font-size-meta);
    color: var(--color-text-secondary);
  }
</style>
