<script lang="ts">
  import { page } from '$app/state';
  import { Collapsible, DropdownMenu } from 'bits-ui';
  import Button from '$lib/components/Button/Button.svelte';
  import { cards } from '$lib/content/cards';
  import avatarSrc from '$lib/assets/img/avatar.png?enhanced';

  type PortfolioLink = {
    href: string;
    label: string;
  };

  let mobileNavOpen = $state(false);
  let mobilePortfolioOpen = $state(false);

  const isPortfolioRoute = $derived(page.url.pathname.startsWith('/portfolio'));
  const downloadFile = $derived((page.data as { downloadFile?: string }).downloadFile);
  const portfolioLinks: PortfolioLink[] = [
    { href: '/portfolio/', label: 'Overview' },
    ...cards.map((card) => ({ href: card.url, label: card.title })),
  ];

  function handleMobileNavChange(open: boolean) {
    mobileNavOpen = open;

    if (!open) {
      mobilePortfolioOpen = false;
    }
  }
</script>

<nav class="nav" aria-label="Primary">
  <div class="nav__row">
    <a href="/" class="nav__brand" aria-label="Andrew Pucci, home">
      <enhanced:img class="nav__avatar" src={avatarSrc} alt="" sizes="42px" />
    </a>

    <Collapsible.Root class="nav__mobile" open={mobileNavOpen} onOpenChange={handleMobileNavChange}>
      <Collapsible.Trigger
        type="button"
        class="nav__toggle"
        aria-controls="nav-links"
        aria-label="Toggle navigation"
      >
        ☰
      </Collapsible.Trigger>

      <Collapsible.Content class="nav__mobile-links" id="nav-links">
        <a href="/" class="nav__link" aria-current={page.url.pathname === '/' ? 'page' : undefined}>
          About
        </a>
        <a
          href="/resume/"
          class="nav__link"
          aria-current={page.url.pathname === '/resume/' ? 'page' : undefined}
        >
          Résumé
        </a>

        <Collapsible.Root bind:open={mobilePortfolioOpen} class="nav__mobile-submenu">
          <Collapsible.Trigger
            type="button"
            class="nav__link nav__submenu-trigger"
            aria-current={isPortfolioRoute ? 'page' : undefined}
          >
            <span>Portfolio</span>
            <span aria-hidden="true">{mobilePortfolioOpen ? '−' : '+'}</span>
          </Collapsible.Trigger>

          <Collapsible.Content class="nav__mobile-submenu-content">
            {#each portfolioLinks as link (link.href)}
              <a href={link.href} class="nav__submenu-link">{link.label}</a>
            {/each}
          </Collapsible.Content>
        </Collapsible.Root>

        {#if downloadFile}
          <div class="nav__download nav__download--mobile">
            <Button href={downloadFile} target="_blank" rel="noopener noreferrer">Download</Button>
          </div>
        {/if}
      </Collapsible.Content>
    </Collapsible.Root>

    <div class="nav__desktop-links">
      <a href="/" class="nav__link" aria-current={page.url.pathname === '/' ? 'page' : undefined}>About</a>
      <a
        href="/resume/"
        class="nav__link"
        aria-current={page.url.pathname === '/resume/' ? 'page' : undefined}
      >
        Résumé
      </a>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          type="button"
          class="nav__link nav__dropdown-trigger"
          aria-current={isPortfolioRoute ? 'page' : undefined}
        >
          Portfolio
        </DropdownMenu.Trigger>

        <DropdownMenu.Content class="nav__dropdown-menu" sideOffset={10}>
          {#each portfolioLinks as link (link.href)}
            <DropdownMenu.Item textValue={link.label}>
              {#snippet child({ props })}
                <a {...props} href={link.href} class="nav__dropdown-link">{link.label}</a>
              {/snippet}
            </DropdownMenu.Item>
          {/each}
        </DropdownMenu.Content>
      </DropdownMenu.Root>

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

  .nav__brand {
    flex-shrink: 0;
  }

  .nav__avatar {
    width: 42px;
    height: 42px;
    border-radius: var(--radius-full);
  }

  .nav__mobile {
    margin-inline-start: auto;
  }

  .nav__toggle {
    cursor: pointer;
    background: none;
    border: none;
    font-size: 1.5rem;
  }

  .nav__mobile-links {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
    width: min(18rem, calc(100vw - (var(--space-3) * 2)));
    margin-top: var(--space-2);
    padding: var(--space-3);
    background: var(--card-background);
    border: 1px solid var(--card-border-color);
    border-radius: var(--card-radius);
  }

  .nav__desktop-links {
    display: none;
    align-items: center;
    gap: var(--space-3);
    margin-inline-start: auto;
  }

  .nav__link {
    font: var(--typography-label);
    color: var(--nav-link-color-default);
    cursor: pointer;
    background: none;
    border: none;
    padding: 0;
  }

  .nav__link:hover {
    color: var(--nav-link-color-hover);
  }

  .nav__link[aria-current='page'] {
    color: var(--nav-link-color-active);
    text-decoration: underline;
  }

  .nav__submenu-trigger {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    width: 100%;
  }

  .nav__mobile-submenu {
    width: 100%;
  }

  .nav__mobile-submenu-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    width: 100%;
    margin-top: var(--space-2);
    padding-inline-start: var(--space-3);
    border-inline-start: 1px solid var(--card-border-color);
  }

  .nav__submenu-link {
    font: var(--typography-label);
    color: var(--nav-link-color-default);
  }

  .nav__submenu-link:hover,
  .nav__dropdown-link:hover,
  .nav__dropdown-link[data-highlighted] {
    color: var(--nav-link-color-hover);
  }

  .nav__submenu-link[aria-current='page'],
  .nav__dropdown-link[aria-current='page'],
  .nav__dropdown-trigger[data-state='open'] {
    color: var(--nav-link-color-active);
  }

  .nav__dropdown-menu {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    min-width: 14rem;
    padding: var(--space-2) var(--space-3);
    background: var(--card-background);
    border: 1px solid var(--card-border-color);
    border-radius: var(--card-radius);
    box-shadow: 0 1rem 2rem color-mix(in srgb, var(--color-text-default) 10%, transparent);
  }

  .nav__dropdown-link {
    display: block;
    font: var(--typography-label);
    color: var(--nav-link-color-default);
    text-decoration: none;
    outline: none;
  }

  .nav__download--mobile {
    width: 100%;
  }

  @media (min-width: 62rem) {
    .nav__mobile {
      display: none;
    }

    .nav__desktop-links {
      display: flex;
    }
  }
</style>
