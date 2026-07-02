<script lang="ts">
  import { page } from '$app/state';
  import Button from '$lib/components/Button/Button.svelte';
  import { cards } from '$lib/content/cards';
  import avatarSrc from '$lib/assets/img/avatar.png?enhanced';

  let open = $state(false);

  const isPortfolioRoute = $derived(page.url.pathname.startsWith('/portfolio'));
  const downloadFile = $derived((page.data as { downloadFile?: string }).downloadFile);
</script>

<nav class="nav" aria-label="Primary">
  <div class="nav__row">
    <a href="/" class="nav__brand" aria-label="Andrew Pucci, home">
      <enhanced:img class="nav__avatar" src={avatarSrc} alt="" sizes="42px" />
    </a>

    <button
      type="button"
      class="nav__toggle"
      aria-expanded={open}
      aria-controls="nav-links"
      aria-label="Toggle navigation"
      onclick={() => (open = !open)}
    >
      ☰
    </button>

    <div class="nav__links" id="nav-links" class:nav__links--open={open}>
      <a href="/" class="nav__link" aria-current={page.url.pathname === '/' ? 'page' : undefined}>About</a>
      <a
        href="/resume/"
        class="nav__link"
        aria-current={page.url.pathname === '/resume/' ? 'page' : undefined}
      >
        Résumé
      </a>

      <details class="nav__dropdown">
        <summary class="nav__link" aria-current={isPortfolioRoute ? 'page' : undefined}>Portfolio</summary>
        <ul class="nav__dropdown-menu">
          <li><a href="/portfolio/">Overview</a></li>
          {#each cards as card (card.url)}
            <li><a href={card.url}>{card.title}</a></li>
          {/each}
        </ul>
      </details>

      {#if downloadFile}
        <div class="nav__download">
          <Button href={downloadFile} target="_blank" rel="noopener noreferrer">Download</Button>
        </div>
      {/if}
    </div>
  </div>
</nav>

<style>
  .nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 10;
    background: color-mix(in srgb, var(--color-surface-default) 98%, transparent);
    padding-block: var(--space-2);
  }

  .nav__row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    max-width: 75rem;
    margin-inline: auto;
    padding-inline: var(--space-3);
  }

  .nav__avatar {
    width: 42px;
    height: 42px;
    border-radius: var(--radius-full);
  }

  .nav__toggle {
    cursor: pointer;
    background: none;
    border: none;
    font-size: 1.5rem;
    margin-inline-start: auto;
  }

  .nav__links {
    display: none;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
    width: 100%;
  }

  .nav__links--open {
    display: flex;
  }

  .nav__link,
  summary.nav__link {
    font: var(--typography-label);
    color: var(--nav-link-color-default);
    cursor: pointer;
  }

  .nav__link:hover,
  summary.nav__link:hover {
    color: var(--nav-link-color-hover);
  }

  .nav__link[aria-current='page'],
  summary.nav__link[aria-current='page'] {
    color: var(--nav-link-color-active);
    text-decoration: underline;
  }

  .nav__dropdown {
    position: relative;
  }

  .nav__dropdown-menu {
    position: absolute;
    inset-inline-start: 0;
    top: 100%;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    margin: var(--space-1) 0 0;
    padding: var(--space-2) var(--space-3);
    min-width: 12rem;
    background: var(--card-background);
    border: 1px solid var(--card-border-color);
    border-radius: var(--card-radius);
    list-style: none;
  }

  .nav__dropdown-menu a {
    font: var(--typography-label);
    color: var(--nav-link-color-default);
  }

  .nav__download {
    margin-inline-start: 0;
  }

  @media (min-width: 62rem) {
    .nav__toggle {
      display: none;
    }

    .nav__links {
      display: flex;
      flex-direction: row;
      align-items: center;
      width: auto;
    }

    .nav__download {
      margin-inline-start: auto;
    }
  }
</style>
