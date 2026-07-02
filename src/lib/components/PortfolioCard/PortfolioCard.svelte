<script lang="ts">
  import Card from '$lib/components/Card/Card.svelte';
  import type { PortfolioCardData } from '$lib/types/portfolio';
  import { portfolioImage } from '$lib/utils/portfolio-images';

  let { title, content, imgSrc, imgAlt, url }: PortfolioCardData = $props();
  const image = $derived(portfolioImage(imgSrc));
</script>

<Card href={url} class="portfolio-card">
  <enhanced:img class="portfolio-card__image" src={image} alt={imgAlt} sizes="min(384px, 100vw)" />
  <h3 class="portfolio-card__title">{title}</h3>
  <p class="portfolio-card__content">{content}</p>
</Card>

<style>
  :global(.portfolio-card) {
    overflow: hidden;
  }

  .portfolio-card__image {
    /* Project screenshots are artifacts of the work, not the work itself (DESIGN.md). */
    filter: grayscale(100%);
    /* The global img reset (app.css) sets max-width: 100%, which silently clamps
       this back down to the card's content width and cancels the bleed below.
       Override it so the +padding*2 overflow actually takes effect. */
    max-width: none;
    width: calc(100% + var(--card-padding) * 2);
    /* enhanced:img sets width/height attrs from the source file for CLS purposes;
       without an explicit height here, the box keeps that fixed pixel height while
       our CSS overrides width, distorting the image. `auto` re-derives height from
       the overridden width via the intrinsic aspect ratio. */
    height: auto;
    margin-inline: calc(var(--card-padding) * -1);
    margin-block-start: calc(var(--card-padding) * -1);
    margin-block-end: var(--space-2);
  }

  .portfolio-card__title {
    font: var(--typography-title);
  }

  .portfolio-card__content {
    color: var(--color-text-secondary);
  }
</style>
