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

<!-- Every bits-ui element that needs its own styling is rendered through the
     `child` snippet so it lands in this component's scope and Svelte's
     scoped styles reach it directly, without needing :global() (ADR-0007). -->
<nav class="nav" aria-label="Primary">
  <div class="row">
    <a href="/" class="brand" aria-label="Andrew Pucci, home">
      <enhanced:img class="avatar" src={avatarSrc} alt="" sizes="42px" />
    </a>

    <Collapsible.Root open={mobileNavOpen} onOpenChange={handleMobileNavChange}>
      {#snippet child({ props: mobileRootProps })}
        <div {...mobileRootProps} class="mobile">
          <Collapsible.Trigger>
            {#snippet child({ props: toggleProps })}
              <button {...toggleProps} type="button" class="toggle" aria-label="Toggle navigation">
                ☰
              </button>
            {/snippet}
          </Collapsible.Trigger>

          <Collapsible.Content id="nav-links">
            {#snippet child({ props: mobileLinksProps })}
              <div {...mobileLinksProps} class="mobile-links">
                <a href="/" class="link" aria-current={page.url.pathname === '/' ? 'page' : undefined}>
                  About
                </a>
                <a
                  href="/resume/"
                  class="link"
                  aria-current={page.url.pathname === '/resume/' ? 'page' : undefined}
                >
                  Résumé
                </a>

                <Collapsible.Root bind:open={mobilePortfolioOpen}>
                  {#snippet child({ props: submenuRootProps })}
                    <div {...submenuRootProps} class="mobile-submenu">
                      <Collapsible.Trigger>
                        {#snippet child({ props: submenuTriggerProps })}
                          <button
                            {...submenuTriggerProps}
                            type="button"
                            class="link submenu-trigger"
                            aria-current={isPortfolioRoute ? 'page' : undefined}
                          >
                            <span>Portfolio</span>
                            <span aria-hidden="true">{mobilePortfolioOpen ? '−' : '+'}</span>
                          </button>
                        {/snippet}
                      </Collapsible.Trigger>

                      <Collapsible.Content>
                        {#snippet child({ props: submenuContentProps })}
                          <div {...submenuContentProps} class="mobile-submenu-content">
                            {#each portfolioLinks as link (link.href)}
                              <a href={link.href} class="submenu-link">{link.label}</a>
                            {/each}
                          </div>
                        {/snippet}
                      </Collapsible.Content>
                    </div>
                  {/snippet}
                </Collapsible.Root>

                {#if downloadFile}
                  <div class="download download-mobile">
                    <Button href={downloadFile} target="_blank" rel="noopener noreferrer">Download</Button>
                  </div>
                {/if}
              </div>
            {/snippet}
          </Collapsible.Content>
        </div>
      {/snippet}
    </Collapsible.Root>

    <div class="desktop-links">
      <a href="/" class="link" aria-current={page.url.pathname === '/' ? 'page' : undefined}>About</a>
      <a
        href="/resume/"
        class="link"
        aria-current={page.url.pathname === '/resume/' ? 'page' : undefined}
      >
        Résumé
      </a>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          {#snippet child({ props: dropdownTriggerProps })}
            <button
              {...dropdownTriggerProps}
              type="button"
              class="link dropdown-trigger"
              aria-current={isPortfolioRoute ? 'page' : undefined}
            >
              Portfolio
            </button>
          {/snippet}
        </DropdownMenu.Trigger>

        <DropdownMenu.Content sideOffset={10}>
          {#snippet child({ props: dropdownContentProps })}
            <div {...dropdownContentProps} class="dropdown-menu">
              {#each portfolioLinks as link (link.href)}
                <DropdownMenu.Item textValue={link.label}>
                  {#snippet child({ props: dropdownLinkProps })}
                    <a {...dropdownLinkProps} href={link.href} class="dropdown-link">{link.label}</a>
                  {/snippet}
                </DropdownMenu.Item>
              {/each}
            </div>
          {/snippet}
        </DropdownMenu.Content>
      </DropdownMenu.Root>

      {#if downloadFile}
        <div class="download">
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

  .row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    max-width: 75rem;
    margin-inline: auto;
    padding-inline: var(--space-3);
  }

  .brand {
    flex-shrink: 0;
  }

  .avatar {
    width: 42px;
    height: 42px;
    border-radius: var(--radius-full);
  }

  .mobile {
    margin-inline-start: auto;
  }

  .toggle {
    cursor: pointer;
    background: none;
    border: none;
    font-size: 1.5rem;
  }

  .mobile-links {
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

  /* `display: flex` above and the browser's default `[hidden] { display: none }`
     have equal specificity, so this rule (author styles apply after the UA
     stylesheet) would otherwise always win and keep the panel visible even
     while bits-ui has marked it hidden -- match on data-state instead, same
     as ExpandableImage's Dialog.Content (ADR-0007). */
  .mobile-links[data-state='closed'],
  .mobile-submenu-content[data-state='closed'] {
    display: none;
  }

  .desktop-links {
    display: none;
    align-items: center;
    gap: var(--space-3);
    margin-inline-start: auto;
  }

  .link,
  .submenu-trigger,
  .dropdown-trigger {
    font: var(--typography-label);
    color: var(--nav-link-color-default);
    cursor: pointer;
    background: none;
    border: none;
    padding: 0;
  }

  .link:hover,
  .submenu-trigger:hover,
  .dropdown-trigger:hover {
    color: var(--nav-link-color-hover);
  }

  .link[aria-current='page'],
  .submenu-trigger[aria-current='page'],
  .dropdown-trigger[aria-current='page'] {
    color: var(--nav-link-color-active);
    text-decoration: underline;
  }

  .submenu-trigger {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    width: 100%;
  }

  .mobile-submenu {
    width: 100%;
  }

  .mobile-submenu-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    width: 100%;
    margin-top: var(--space-2);
    padding-inline-start: var(--space-3);
    border-inline-start: 1px solid var(--card-border-color);
  }

  .submenu-link {
    font: var(--typography-label);
    color: var(--nav-link-color-default);
  }

  .submenu-link:hover,
  .dropdown-link:hover,
  .dropdown-link[data-highlighted] {
    color: var(--nav-link-color-hover);
  }

  .submenu-link[aria-current='page'],
  .dropdown-link[aria-current='page'] {
    color: var(--nav-link-color-active);
  }

  .dropdown-trigger[data-state='open'] {
    color: var(--nav-link-color-active);
  }

  .dropdown-menu {
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

  .dropdown-link {
    display: block;
    font: var(--typography-label);
    color: var(--nav-link-color-default);
    text-decoration: none;
    outline: none;
  }

  .download-mobile {
    width: 100%;
  }

  @media (min-width: 62rem) {
    .mobile {
      display: none;
    }

    .desktop-links {
      display: flex;
    }
  }
</style>
