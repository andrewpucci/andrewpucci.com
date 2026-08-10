<script lang="ts">
  import '../app.css';
  import atkinsonLatinUrl from '@fontsource-variable/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-wght-normal.woff2?url';
  import Nav from './Nav.svelte';
  import Footer from './Footer.svelte';

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
  <link rel="preload" href={atkinsonLatinUrl} as="font" type="font/woff2" crossorigin="anonymous" />
</svelte:head>

<a href="#main-content" class="skip-link">Skip to content</a>

<Nav />

<main id="main-content">
  {@render children()}
</main>

<Footer />

<style>
  .skip-link {
    position: absolute;
    top: -3rem;
    left: var(--space-2);
    z-index: 20;
    background: var(--color-surface-default);
    color: var(--color-text-default);
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-sm);
  }

  .skip-link:focus {
    top: var(--space-2);
  }

  main {
    /* Grows to fill leftover space in body's flex column, pushing Footer to
       the bottom of the viewport on pages shorter than it (see app.css).
       The explicit background isn't decorative -- once a browser propagates
       body's background-color to paint the canvas (HTML spec), body's own
       box stops painting that color for itself, so without this, any
       section left transparent here would expose the bottom-overscroll
       pink pseudo-element in app.css's html::after during ordinary
       mid-page scrolling instead of only true overscroll. */
    flex: 1;
    padding-block-start: 4.375rem;
    background-color: var(--color-surface-page);
  }
</style>
