<script lang="ts" generics="T">
  import type { Snippet } from 'svelte';
  import { MediaQuery } from 'svelte/reactivity';
  import { IconChevronLeft, IconChevronRight, IconPlayerPause, IconPlayerPlay } from '@tabler/icons-svelte-runes';
  import { chunkItems } from './chunk-items';

  interface Props {
    items: T[];
    label: string;
    /** Whether the carousel auto-advances. Ignored (forced off) under prefers-reduced-motion. */
    autoplay?: boolean;
    autoplayInterval?: number;
    /** Items shown per slide. Defaults to 1 (one item per slide, the original behavior). */
    itemsPerPage?: number;
    item: Snippet<[T, number]>;
  }

  let {
    items,
    label,
    autoplay = false,
    autoplayInterval = 6000,
    itemsPerPage = 1,
    item,
  }: Props = $props();

  // chunkItems clamps itemsPerPage to >= 1 internally; mirror that clamp here
  // so the index passed to the item snippet (i * pageSize + j) can't diverge
  // from the page sizes chunkItems actually produced.
  let pageSize = $derived(Math.max(1, itemsPerPage));
  let pages = $derived(chunkItems(items, pageSize));
  let activeIndex = $state(0);
  let reducedMotion = new MediaQuery('prefers-reduced-motion: reduce');
  let prefersReducedMotion = $derived(reducedMotion.current);
  let paused = $state(false);
  let playing = $derived(autoplay && !prefersReducedMotion && !paused);

  $effect(() => {
    if (!playing) return;
    const timer = setInterval(goNext, autoplayInterval);
    return () => clearInterval(timer);
  });

  // A viewport resize can cross a breakpoint mid-session and shrink the page
  // count (e.g. 3-per-page -> 1-per-page); keep activeIndex in range.
  $effect(() => {
    if (activeIndex >= pages.length) activeIndex = Math.max(0, pages.length - 1);
  });

  function goNext() {
    if (pages.length === 0) return;
    activeIndex = (activeIndex + 1) % pages.length;
  }

  function goPrev() {
    if (pages.length === 0) return;
    activeIndex = (activeIndex - 1 + pages.length) % pages.length;
  }

  function togglePlaying() {
    paused = !paused;
  }
</script>

<section class="carousel" aria-roledescription="carousel" aria-label={label}>
  <div class="controls">
    <button type="button" class="control" onclick={goPrev} aria-label="Previous slide">
      <IconChevronLeft aria-hidden="true" />
    </button>
    {#if autoplay && !prefersReducedMotion}
      <button
        type="button"
        class="control"
        onclick={togglePlaying}
        aria-pressed={playing}
        aria-label={playing ? 'Pause automatic slide rotation' : 'Play automatic slide rotation'}
      >
        {#if playing}
          <IconPlayerPause aria-hidden="true" />
        {:else}
          <IconPlayerPlay aria-hidden="true" />
        {/if}
      </button>
    {/if}
    <button type="button" class="control" onclick={goNext} aria-label="Next slide">
      <IconChevronRight aria-hidden="true" />
    </button>
  </div>

  <div class="viewport">
    <ul
      class="track"
      class:instant={prefersReducedMotion}
      style:transform={`translateX(-${activeIndex * 100}%)`}
    >
      {#each pages as page, i (i)}
        <li
          class="slide"
          aria-roledescription="slide"
          aria-label={`${i + 1} of ${pages.length}`}
          aria-hidden={i !== activeIndex}
          inert={i !== activeIndex}
        >
          <div class="slide-items">
            {#each page as entry, j (j)}
              {@render item(entry, i * pageSize + j)}
            {/each}
          </div>
        </li>
      {/each}
    </ul>
  </div>

  <p class="visually-hidden" aria-live="polite">Slide {activeIndex + 1} of {pages.length}</p>
</section>

<style>
  .controls {
    display: flex;
    gap: var(--space-2);
    justify-content: flex-end;
    margin-block-end: var(--space-2);
  }

  .control {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--color-text-default);
    background: var(--color-surface-default);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-full);
    width: 2.25rem;
    height: 2.25rem;
  }

  .control:hover {
    color: var(--color-brand-primary);
  }

  .viewport {
    overflow: hidden;
  }

  .track {
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
    transition: transform 0.3s ease;
  }

  .track.instant {
    transition: none;
  }

  .slide {
    flex: 0 0 100%;
    min-width: 0;
  }

  .slide-items {
    display: flex;
    gap: var(--space-3);
  }

  /* :global() here targets the root element of whatever the caller's `item`
     snippet renders -- unknowable/unscopeable from this component. */
  .slide-items > :global(*) {
    flex: 1;
    min-width: 0;
  }
</style>
