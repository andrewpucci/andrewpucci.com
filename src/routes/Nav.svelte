<script lang="ts">
  import { page } from '$app/state';
  import { afterNavigate } from '$app/navigation';
  import { Collapsible, DropdownMenu } from 'bits-ui';
  import { IconDownload, IconMenu2, IconMinus, IconPlus } from '@tabler/icons-svelte-runes';
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
  const overviewLink: PortfolioLink = { href: '/portfolio/', label: 'Overview' };
  const caseStudyLinks: PortfolioLink[] = cards.map((card) => ({ href: card.url, label: card.title }));

  function handleMobileNavChange(open: boolean) {
    mobileNavOpen = open;

    if (!open) {
      mobilePortfolioOpen = false;
    }
  }

  // Nav lives in the root layout, so it isn't remounted between routes --
  // without this, picking a link would leave the mobile menu open over the
  // page it just navigated to.
  afterNavigate(() => {
    mobileNavOpen = false;
    mobilePortfolioOpen = false;
  });
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
                <IconMenu2 aria-hidden="true" />
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
                            {#if mobilePortfolioOpen}
                              <IconMinus aria-hidden="true" />
                            {:else}
                              <IconPlus aria-hidden="true" />
                            {/if}
                          </button>
                        {/snippet}
                      </Collapsible.Trigger>

                      <Collapsible.Content>
                        {#snippet child({ props: submenuContentProps })}
                          <div {...submenuContentProps} class="mobile-submenu-content">
                            <a href={overviewLink.href} class="submenu-link">{overviewLink.label}</a>
                            <hr class="submenu-divider" />
                            {#each caseStudyLinks as link (link.href)}
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
                    <Button href={downloadFile} target="_blank" rel="noopener noreferrer">
                      <IconDownload aria-hidden="true" />
                      Download
                    </Button>
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
          {#snippet child({ props: dropdownContentProps, wrapperProps })}
            <div {...wrapperProps}>
              <div {...dropdownContentProps} class="dropdown-menu">
                <DropdownMenu.Item textValue={overviewLink.label}>
                  {#snippet child({ props: dropdownLinkProps })}
                    <a {...dropdownLinkProps} href={overviewLink.href} class="dropdown-link">{overviewLink.label}</a
                    >
                  {/snippet}
                </DropdownMenu.Item>
                <DropdownMenu.Separator>
                  {#snippet child({ props: separatorProps })}
                    <hr {...separatorProps} class="dropdown-divider" />
                  {/snippet}
                </DropdownMenu.Separator>
                {#each caseStudyLinks as link (link.href)}
                  <DropdownMenu.Item textValue={link.label}>
                    {#snippet child({ props: dropdownLinkProps })}
                      <a {...dropdownLinkProps} href={link.href} class="dropdown-link">{link.label}</a>
                    {/snippet}
                  </DropdownMenu.Item>
                {/each}
              </div>
            </div>
          {/snippet}
        </DropdownMenu.Content>
      </DropdownMenu.Root>

      {#if downloadFile}
        <div class="download">
          <Button href={downloadFile} target="_blank" rel="noopener noreferrer">
            <IconDownload aria-hidden="true" />
            Download
          </Button>
        </div>
      {/if}
    </div>
  </div>
</nav>

<style>
  .nav {
    --nav-background: color-mix(in srgb, var(--color-surface-default) 98%, transparent);
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 10;
    background: var(--nav-background);
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
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background: none;
    border: none;
  }

  /* Absolutely positioned against .nav (the nearest positioned ancestor --
     .row and .mobile are both static) rather than left as a normal-flow
     child of the right-aligned .mobile: that's what lets it span edge to
     edge instead of being sized to a narrow box under the toggle. Same
     background as .nav itself and no border/shadow, so opening it reads as
     the header bar itself growing taller, not a card popping up next to it. */
  .mobile-links {
    position: absolute;
    inset-inline: 0;
    top: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-3);
    background: var(--nav-background);
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

  /* flex: 1 (not margin-inline-start: auto) so the box itself fills the
     row's remaining width, leaving About/Résumé/Portfolio anchored to its
     left edge -- .download's own auto margin then pushes just that item
     right. Anchoring the whole block to the row's right edge instead would
     shift every link sideways whenever a page's downloadFile toggles the
     button on or off. */
  .desktop-links {
    display: none;
    align-items: center;
    flex: 1;
    gap: var(--space-3);
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
    padding: var(--space-2) var(--space-3);
    background: var(--card-background);
    border: 1px solid var(--card-border-color);
    border-radius: var(--card-radius);
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

  .submenu-divider,
  .dropdown-divider {
    width: 100%;
    height: 1px;
    margin: var(--space-1) 0;
    border: none;
    background: var(--card-border-color);
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

    .desktop-links .download {
      margin-inline-start: auto;
    }
  }
</style>
