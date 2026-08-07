<script lang="ts">
  import CaseStudyLayout from '$lib/components/CaseStudyLayout/CaseStudyLayout.svelte';
  import Carousel from '$lib/components/Carousel/Carousel.svelte';
  import PortfolioCard from '$lib/components/PortfolioCard/PortfolioCard.svelte';
  import { cards } from '$lib/content/cards';
  import { getCaseStudy } from '$lib/content/portfolio';
  import { portfolioImage } from '$lib/utils/portfolio-images';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  const entry = $derived(getCaseStudy(data.metadata.slug)!);
  const CaseStudyBody = $derived(entry.Component);
  const otherCards = $derived(cards.filter((card) => !card.url.includes(`/${data.metadata.slug}/`)));
  const heroImage = $derived(portfolioImage(data.metadata.hero));
</script>

<svelte:head>
  <title>{data.metadata.title}</title>
  <meta name="description" content={data.metadata.description} />
</svelte:head>

<CaseStudyLayout
  heroImage={heroImage}
  heroTitle={data.metadata.heroTitle}
  team={data.metadata.team}
  responsibilities={data.metadata.responsibilities}
  tools={data.metadata.tools}
  bodyClass="case-study-body"
>
  <CaseStudyBody />
</CaseStudyLayout>

<section class="more-projects" aria-labelledby="more-projects-heading">
  <h2 id="more-projects-heading">More Projects</h2>
  <Carousel items={otherCards} label="Other portfolio projects">
    {#snippet item(card)}
      <PortfolioCard {...card} />
    {/snippet}
  </Carousel>
</section>

<style>
  .more-projects {
    max-width: 75rem;
    margin-inline: auto;
    padding: 0 var(--space-3) var(--space-5);
  }

  :global(.case-study-body p.lead) {
    font: var(--typography-title);
    color: var(--color-text-secondary);
    margin-block-end: var(--space-4);
  }

  :global(.case-study-body .case-study-steps) {
    display: grid;
    gap: var(--space-3);
    margin: var(--space-3) 0;
  }

  :global(.case-study-body .case-study-step dt) {
    font: var(--typography-title);
  }

  :global(.case-study-body .case-study-step dd) {
    margin: 0;
    color: var(--color-text-secondary);
  }

  @media (min-width: 62rem) {
    :global(.case-study-body .case-study-steps) {
      grid-template-columns: repeat(3, 1fr);
    }
  }
</style>
