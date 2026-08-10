<script lang="ts">
  import CaseStudyLayout from '$lib/components/CaseStudyLayout/CaseStudyLayout.svelte';
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

<CaseStudyLayout
  heroImage={heroImage}
  heroTitle={data.metadata.heroTitle}
  team={data.metadata.team}
  responsibilities={data.metadata.responsibilities}
  tools={data.metadata.tools}
  showIcons={false}
  bodyClass="archive-body"
>
  <ArchiveCaseStudyBody />
</CaseStudyLayout>

<style>
  :global(.archive-body img) {
    display: block;
    max-width: 100%;
    height: auto;
    margin-block: var(--space-3);
    background: var(--color-surface-default);
  }

  :global(.archive-body .carousel-inner),
  :global(.archive-body .row) {
    display: grid;
    gap: var(--space-3);
  }

  :global(.archive-body .carousel-indicators) {
    display: none;
  }
</style>
