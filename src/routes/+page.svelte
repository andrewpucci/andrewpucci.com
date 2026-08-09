<script lang="ts">
  import { MediaQuery } from 'svelte/reactivity';
  import { IconCode, IconHeart, IconUsers } from '@tabler/icons-svelte-runes';
  import Carousel from '$lib/components/Carousel/Carousel.svelte';
  import PortfolioCard from '$lib/components/PortfolioCard/PortfolioCard.svelte';
  import TestimonialQuote from '$lib/components/TestimonialQuote/TestimonialQuote.svelte';
  import { cards } from '$lib/content/cards';
  import heroSrc from '$lib/assets/img/background.jpg?enhanced';
  import jaxAvatar from '$lib/assets/img/jaxheinzen.jpg?enhanced';
  import nondiniAvatar from '$lib/assets/img/nondininaqui.jpg?enhanced';

  // Matches the 1/2/3-column breakpoints already used by portfolio/+page.svelte's
  // .grid for the same cards. MediaQuery's `current` is only known once mounted in
  // the browser, so the static HTML always ships at 1 card/page; hydration then
  // reflows to 2 or 3 on tablet/desktop -- a synchronous-read alternative would
  // avoid that flash but risks an actual hydration mismatch, which is worse.
  let tablet = new MediaQuery('min-width: 48rem');
  let desktop = new MediaQuery('min-width: 62rem');
  let desktopItemsPerPage = $derived(desktop.current ? 3 : tablet.current ? 2 : 1);
</script>

<svelte:head>
  <title>Andrew Pucci | Principal UX Designer</title>
  <meta
    name="description"
    content="Andrew Pucci is a principal UX designer, accessibility practitioner, and design systems engineer."
  />
</svelte:head>

<section class="hero">
  <enhanced:img class="image" src={heroSrc} alt="" sizes="720px" fetchpriority="high" />
  <h1 class="headline">
    <span>Hi, I'm Andrew. I grow teams who build engaging, usable, and accessible products.</span>
  </h1>
</section>

<section class="icon-blocks">
  <div class="icon-block">
    <IconUsers class="icon" aria-hidden="true" />
    <h2>People-focused</h2>
    <p>
      Innately interested in how people interact both between themselves and with software, I've been involved in
      the user experience design world for about 10 years.
    </p>
  </div>

  <div class="icon-block">
    <IconCode class="icon" aria-hidden="true" />
    <h2>Technical background</h2>
    <p>
      Coming from a software engineering background has given me the ability to empathize with the developers on my
      team and informs my design decisions.
    </p>
  </div>

  <div class="icon-block">
    <IconHeart class="icon" aria-hidden="true" />
    <h2>Engaged in the community</h2>
    <p>
      Whether volunteering my time reviewing conference submissions or heading up local UX groups, community has
      always been an important part of the work I do.
    </p>
  </div>
</section>

<section class="testimonials">
  <TestimonialQuote
    quote="Andrew has an innate talent for leadership and mentorship. As a manager, Andrew never acts like a superior, he acts like an advocate. He doesn't say “Here's what you need to improve on,” he asks “Where do you want to grow?” and “How can I learn from you, too?” He intuits strengths and gives the space to run with them with total support. Under his guidance, I grew more in skill and confidence in two years than I had in the past five. It honestly turned what had been an intimidating and imposter-syndrome-packed career change into an awesome experience."
    authorName="Jax Heinzen"
    authorRole="Experience Research & Design, Binary Defense"
    authorUrl="https://www.linkedin.com/in/jacquelineheinzen/"
    avatar={jaxAvatar}
  />
  <TestimonialQuote
    quote="Andrew took on a variety of responsibilities at Society of Grownups–in true startup fashion. He not only supported and onboarded the technology team, but was instrumental in the launch of societyofgrownups.com. Andrew then moved into a bigger leadership role where he built the processes to attract, retain, and grow talent as the company expanded from 5 to 55 employees. Andrew's attitude is exemplary and his level of drive, grit, and initiative is truly incredible. Whether it was leading by example, analyzing and driving the metrics on employee satisfaction, Andrew is truly dedicated and gifted."
    authorName="Nondini Naqui"
    authorRole="CEO & President, Society of Grownups"
    authorUrl="https://www.linkedin.com/in/nondini/"
    avatar={nondiniAvatar}
  />
</section>

<section class="portfolio" aria-labelledby="portfolio-heading">
  <h2 id="portfolio-heading">Portfolio</h2>
  <Carousel items={cards} label="Portfolio projects" autoplay={true} itemsPerPage={desktopItemsPerPage}>
    {#snippet item(card)}
      <PortfolioCard {...card} imageLoading="lazy" />
    {/snippet}
  </Carousel>
</section>

<style>
  .hero {
    position: relative;
  }

  .image {
    width: 100%;
    min-height: 45vh;
    max-height: 45vh;
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
    /* DTCG dimension tokens can't hold a fluid clamp() (see ADR-0006's
       amendment), so the min/max are tokenized separately and the clamp
       itself -- including the non-tokenized vw interpolation term from
       DESIGN.md -- is composed here. */
    font-family: var(--font-family-sans);
    font-weight: var(--font-weight-bold);
    font-size: clamp(var(--font-size-display-min), calc(1.475rem + 2.7vw), var(--font-size-display-max));
    line-height: var(--font-lineheight-tight);
    color: var(--color-surface-default);
    background: var(--color-gray-900);
    padding-inline: var(--space-2);
  }

  .icon-blocks {
    display: grid;
    gap: var(--space-4);
    max-width: 75rem;
    margin-inline: auto;
    padding: var(--space-5) var(--space-3);
  }

  /* flex column + align-items: center replaces the old text-align: center
     trick -- that only centers inline-level content, and Tabler icons render
     as display: block, so text-align alone leaves the icon flush left.
     h2/p opt back into full-width via align-self so their own text-align
     centering (inherited) is unaffected. */
  .icon-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .icon-block h2,
  .icon-block p {
    align-self: stretch;
  }

  /* IconUsers/IconCode/IconHeart are components, not raw <svg> -- Svelte's
     scoped-CSS hash never reaches a class forwarded into a child component,
     so this needs the ancestor :global() idiom (same fix, same root cause,
     as Nav.svelte's forwarded bits-ui classes, ADR-0007). */
  .icon-block :global(.icon) {
    color: var(--color-brand-primary);
    margin-block-end: var(--space-2);
  }

  .testimonials {
    display: grid;
    gap: var(--space-4);
    max-width: 75rem;
    margin-inline: auto;
    padding: var(--space-5) var(--space-3);
    content-visibility: auto;
    contain-intrinsic-block-size: auto 62.5rem;
  }

  .portfolio {
    max-width: 75rem;
    margin-inline: auto;
    padding: 0 var(--space-3) var(--space-5);
    content-visibility: auto;
    contain-intrinsic-block-size: auto 32rem;
  }

  @media (min-width: 62rem) {
    .icon-blocks {
      grid-template-columns: repeat(3, 1fr);
    }

    .testimonials {
      grid-template-columns: repeat(2, 1fr);
      contain-intrinsic-block-size: auto 23.3125rem;
    }

    .portfolio {
      contain-intrinsic-block-size: auto 59.25rem;
    }
  }
</style>
