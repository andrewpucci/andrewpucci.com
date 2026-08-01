<script lang="ts">
  import { author } from '$lib/content/author';

  const year = new Date().getFullYear();
</script>

<footer class="footer">
  <div class="row">
    <div class="about">
      <h2>About Me</h2>
      <p>
        I am a user experience designer who has built a career around the intersection of design and development. I
        am eager to grow teams who build engaging, usable, and accessible products and lead cross-functional
        projects from inception through post-release iteration. I have experience working across multiple industries
        and in companies ranging in maturity from early-stage startups to Fortune 500 enterprises. Want to chat?
        <a href="/contact/">Get in touch!</a>
      </p>
    </div>

    <div class="connect">
      <h2>Connect</h2>
      <ul class="social">
        {#each author.social as link (link.url)}
          <li><a href={link.url}>{link.name}</a></li>
        {/each}
      </ul>
    </div>
  </div>

  <p class="colophon">
    &copy; {year} Andrew Pucci. Made with
    <a href="https://svelte.dev/">SvelteKit</a>, hosted on
    <a href="https://www.cloudflare.com/">Cloudflare</a>, source on
    <a href="https://github.com/andrewpucci/andrewpucci.com">GitHub</a>.
  </p>
</footer>

<style>
  .footer {
    background: var(--footer-background);
    color: var(--footer-foreground);
    padding-block: var(--footer-padding-block);
  }

  .footer,
  .footer :global(a) {
    color: var(--footer-foreground);
  }

  .footer :global(a) {
    text-decoration: none;
  }

  .footer :global(a:hover) {
    text-decoration: underline;
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-4);
    max-width: 75rem;
    margin-inline: auto;
    padding-inline: var(--space-3);
  }

  .about {
    flex: 3 1 20rem;
  }

  .connect {
    flex: 1 1 12rem;
  }

  .social {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .colophon {
    max-width: 75rem;
    margin-inline: auto;
    margin-block-start: var(--space-4);
    padding-inline: var(--space-3);
  }
</style>
