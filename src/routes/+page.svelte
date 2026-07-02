<script lang="ts">
  import Carousel from '$lib/components/Carousel/Carousel.svelte';
  import PortfolioCard from '$lib/components/PortfolioCard/PortfolioCard.svelte';
  import TestimonialQuote from '$lib/components/TestimonialQuote/TestimonialQuote.svelte';
  import { cards } from '$lib/content/cards';
  import heroSrc from '$lib/assets/img/background.jpg?enhanced';
  import jaxAvatar from '$lib/assets/img/jaxheinzen.jpg?enhanced';
  import nondiniAvatar from '$lib/assets/img/nondininaqui.jpg?enhanced';
</script>

<svelte:head>
  <title>Andrew Pucci | Principal UX Designer</title>
  <meta
    name="description"
    content="Andrew Pucci is a principal UX designer, accessibility practitioner, and design systems engineer."
  />
</svelte:head>

<section class="hero">
  <enhanced:img class="hero__image" src={heroSrc} alt="" sizes="100vw" fetchpriority="high" />
  <h1 class="hero__headline">
    <span>Hi, I'm Andrew. I grow teams who build engaging, usable, and accessible products.</span>
  </h1>
</section>

<section class="icon-blocks">
  <div class="icon-block">
    <svg class="icon-block__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
    <h2>People-focused</h2>
    <p>
      Innately interested in how people interact both between themselves and with software, I've been involved in
      the user experience design world for about 10 years.
    </p>
  </div>

  <div class="icon-block">
    <svg class="icon-block__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <polyline points="8 6 2 12 8 18" />
      <polyline points="16 6 22 12 16 18" />
    </svg>
    <h2>Technical background</h2>
    <p>
      Coming from a software engineering background has given me the ability to empathize with the developers on my
      team and informs my design decisions.
    </p>
  </div>

  <div class="icon-block">
    <svg class="icon-block__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      />
    </svg>
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
  <Carousel items={cards} label="Portfolio projects" autoplay={true}>
    {#snippet item(card)}
      <PortfolioCard {...card} />
    {/snippet}
  </Carousel>
</section>

<style>
  .hero {
    position: relative;
  }

  .hero__image {
    width: 100%;
    min-height: 45vh;
    max-height: 45vh;
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

  .icon-block {
    text-align: center;
  }

  .icon-block__icon {
    color: var(--color-brand-primary);
    width: 2.5rem;
    height: 2.5rem;
    margin-block-end: var(--space-2);
  }

  .testimonials {
    display: grid;
    gap: var(--space-4);
    max-width: 75rem;
    margin-inline: auto;
    padding: var(--space-5) var(--space-3);
  }

  .portfolio {
    max-width: 75rem;
    margin-inline: auto;
    padding: 0 var(--space-3) var(--space-5);
  }

  @media (min-width: 62rem) {
    .icon-blocks {
      grid-template-columns: repeat(3, 1fr);
    }

    .testimonials {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
