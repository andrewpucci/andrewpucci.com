<script lang="ts">
  import '../app.css';
  import Nav from './Nav.svelte';
  import Footer from './Footer.svelte';

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
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
    padding-block-start: 4.375rem;
  }
</style>
