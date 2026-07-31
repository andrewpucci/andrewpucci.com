<script lang="ts" generics="T">
  import type { Snippet } from 'svelte';

  interface Props {
    items: T[];
    label: string;
    /** Whether the carousel auto-advances. Ignored (forced off) under prefers-reduced-motion. */
    autoplay?: boolean;
    autoplayInterval?: number;
    item: Snippet<[T, number]>;
  }

  let { items, label, autoplay = false, autoplayInterval = 6000, item }: Props = $props();

  let activeIndex = $state(0);
  let prefersReducedMotion = $state(false);
  let manuallyPaused = $state(false);
  let playing = $derived(autoplay && !prefersReducedMotion && !manuallyPaused);

  $effect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      prefersReducedMotion = query.matches;
    };
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  });

  $effect(() => {
    if (!playing) return;
    const timer = setInterval(goNext, autoplayInterval);
    return () => clearInterval(timer);
  });

  function goNext() {
    activeIndex = (activeIndex + 1) % items.length;
  }

  function goPrev() {
    activeIndex = (activeIndex - 1 + items.length) % items.length;
  }

  function togglePlaying() {
    manuallyPaused = !manuallyPaused;
  }
</script>

<section class="carousel" aria-roledescription="carousel" aria-label={label}>
  <div class="carousel__controls">
    <button type="button" class="carousel__control" onclick={goPrev} aria-label="Previous slide">
      ‹
    </button>
    {#if autoplay && !prefersReducedMotion}
      <button
        type="button"
        class="carousel__control"
        onclick={togglePlaying}
        aria-pressed={playing}
        aria-label={playing ? 'Pause automatic slide rotation' : 'Play automatic slide rotation'}
      >
        {playing ? '⏸' : '▶'}
      </button>
    {/if}
    <button type="button" class="carousel__control" onclick={goNext} aria-label="Next slide">
      ›
    </button>
  </div>

  <div class="carousel__viewport">
    <ul
      class="carousel__track"
      class:carousel__track--instant={prefersReducedMotion}
      style:transform={`translateX(-${activeIndex * 100}%)`}
    >
      {#each items as entry, i (i)}
        <li
          class="carousel__slide"
          aria-roledescription="slide"
          aria-label={`${i + 1} of ${items.length}`}
          aria-hidden={i !== activeIndex}
          inert={i !== activeIndex}
        >
          {@render item(entry, i)}
        </li>
      {/each}
    </ul>
  </div>

  <p class="visually-hidden" aria-live="polite">Slide {activeIndex + 1} of {items.length}</p>
</section>

<style>
  .carousel__controls {
    display: flex;
    gap: var(--space-2);
    justify-content: flex-end;
    margin-block-end: var(--space-2);
  }

  .carousel__control {
    cursor: pointer;
    color: var(--color-text-default);
    background: var(--color-surface-default);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-full);
    width: 2.25rem;
    height: 2.25rem;
    font-size: 1.25rem;
    line-height: 1;
  }

  .carousel__control:hover {
    color: var(--color-brand-primary);
  }

  .carousel__viewport {
    overflow: hidden;
  }

  .carousel__track {
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
    transition: transform 0.3s ease;
  }

  .carousel__track--instant {
    transition: none;
  }

  .carousel__slide {
    flex: 0 0 100%;
    min-width: 0;
  }
</style>
