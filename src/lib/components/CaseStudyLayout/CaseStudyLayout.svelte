<script lang="ts">
  import type { Picture } from '@sveltejs/enhanced-img';
  import type { Snippet } from 'svelte';

  type LinkedItem = { name: string; link?: string };

  let {
    heroImage,
    heroTitle,
    team,
    responsibilities,
    tools,
    showIcons = true,
    bodyClass = '',
    children
  }: {
    heroImage: Picture;
    heroTitle: string;
    team: LinkedItem[];
    responsibilities: string[];
    tools: LinkedItem[];
    showIcons?: boolean;
    bodyClass?: string;
    children: Snippet;
  } = $props();
</script>

<article>
  <div class="hero">
    <enhanced:img class="image" src={heroImage} alt="" sizes="100vw" />
    <h1 class="headline"><span>{heroTitle}</span></h1>
  </div>

  <div class="meta-blocks">
    <div class="meta-block">
      {#if showIcons}
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      {/if}
      <h2>Project Team</h2>
      <ul>
        {#each team as person (person.name)}
          <li>{#if person.link}<a href={person.link}>{person.name}</a>{:else}{person.name}{/if}</li>
        {/each}
      </ul>
    </div>

    <div class="meta-block">
      {#if showIcons}
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" ry="1" />
        </svg>
      {/if}
      <h2>Responsibilities</h2>
      <ul>
        {#each responsibilities as responsibility (responsibility)}
          <li>{responsibility}</li>
        {/each}
      </ul>
    </div>

    <div class="meta-block">
      {#if showIcons}
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path
            d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
          />
        </svg>
      {/if}
      <h2>Tools Used</h2>
      <ul>
        {#each tools as tool (tool.name)}
          <li>{#if tool.link}<a href={tool.link}>{tool.name}</a>{:else}{tool.name}{/if}</li>
        {/each}
      </ul>
    </div>
  </div>

  <div class="body {bodyClass}">
    {@render children()}
  </div>
</article>

<style>
  .hero {
    position: relative;
  }

  .image {
    width: 100%;
    min-height: 25vh;
    max-height: 34vh;
    object-fit: cover;
    filter: blur(0.3125rem) grayscale(100%) opacity(30%);
  }

  .headline {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-3);
  }

  .headline span {
    /* See src/routes/+page.svelte's .headline for why this composes
       a clamp() from paired tokens instead of using --typography-headline. */
    font-family: var(--font-family-sans);
    font-weight: var(--font-weight-bold);
    font-size: clamp(var(--font-size-headline-min), calc(1.175rem + 1.5vw), var(--font-size-headline-max));
    line-height: var(--font-lineheight-snug);
    color: var(--color-surface-default);
    background: var(--color-gray-900);
    padding-inline: var(--space-2);
  }

  .meta-blocks {
    display: grid;
    gap: var(--space-4);
    max-width: 75rem;
    margin-inline: auto;
    padding: var(--space-4) var(--space-3);
    text-align: center;
  }

  .icon {
    color: var(--color-brand-primary);
    width: 2.5rem;
    height: 2.5rem;
    margin-block-end: var(--space-2);
  }

  .meta-block ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .body {
    max-width: 48rem;
    margin-inline: auto;
    padding: 0 var(--space-3) var(--space-5);
  }

  @media (min-width: 62rem) {
    .meta-blocks {
      grid-template-columns: repeat(3, 1fr);
    }
  }
</style>
