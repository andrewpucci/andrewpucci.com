<script lang="ts">
  import { getArchiveCaseStudy } from '$lib/content/archive';
  import { portfolioImage } from '$lib/utils/portfolio-images';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  const entry = $derived(getArchiveCaseStudy(data.metadata.slug)!);
  const ArchiveCaseStudyBody = $derived(entry.Component);
  const heroImage = $derived(portfolioImage(data.metadata.hero));
</script>

<svelte:head>
  <title>{data.metadata.title}</title>
  <meta name="description" content={data.metadata.description} />
  <meta name="robots" content="noindex" />
</svelte:head>

<article>
  <div class="hero">
    <enhanced:img class="hero__image" src={heroImage} alt="" sizes="100vw" />
    <h1 class="hero__headline"><span>{data.metadata.heroTitle}</span></h1>
  </div>

  <div class="meta-blocks">
    <div class="meta-block">
      <h2>Project Team</h2>
      <ul>
        {#each data.metadata.team as person (person.name)}
          <li>{#if person.link}<a href={person.link}>{person.name}</a>{:else}{person.name}{/if}</li>
        {/each}
      </ul>
    </div>

    <div class="meta-block">
      <h2>Responsibilities</h2>
      <ul>
        {#each data.metadata.responsibilities as responsibility (responsibility)}
          <li>{responsibility}</li>
        {/each}
      </ul>
    </div>

    <div class="meta-block">
      <h2>Tools Used</h2>
      <ul>
        {#each data.metadata.tools as tool (tool.name)}
          <li>{#if tool.link}<a href={tool.link}>{tool.name}</a>{:else}{tool.name}{/if}</li>
        {/each}
      </ul>
    </div>
  </div>

  <div class="archive-body">
    <ArchiveCaseStudyBody />
  </div>
</article>

<style>
  .hero {
    position: relative;
  }

  .hero__image {
    width: 100%;
    min-height: 25vh;
    max-height: 34vh;
    object-fit: cover;
    filter: blur(0.3125rem) grayscale(100%) opacity(30%);
  }

  .hero__headline {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-3);
  }

  .hero__headline span {
    font-family: var(--font-family-sans);
    font-weight: var(--font-weight-bold);
    font-size: clamp(
      var(--font-size-headline-min),
      calc(1.175rem + 1.5vw),
      var(--font-size-headline-max)
    );
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

  .meta-block ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .archive-body {
    max-width: 48rem;
    margin-inline: auto;
    padding: 0 var(--space-3) var(--space-5);
  }

  .archive-body :global(img) {
    display: block;
    max-width: 100%;
    height: auto;
    margin-block: var(--space-3);
    background: var(--color-surface-default);
  }

  .archive-body :global(.carousel-inner),
  .archive-body :global(.row) {
    display: grid;
    gap: var(--space-3);
  }

  .archive-body :global(.carousel-indicators) {
    display: none;
  }

  @media (min-width: 62rem) {
    .meta-blocks {
      grid-template-columns: repeat(3, 1fr);
    }
  }
</style>
