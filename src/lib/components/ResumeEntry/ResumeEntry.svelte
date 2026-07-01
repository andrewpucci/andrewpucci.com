<script lang="ts">
  import { formatMonthYear, toISODate } from '$lib/utils/date';

  interface Props {
    title: string;
    start: string;
    /** ISO date string, or the literal "present". Omitted means the entry has no end (rare). */
    end?: string;
    organization?: string;
    organizationUrl?: string;
    location?: string;
    /** Pre-rendered HTML (from markdown authored in this repo, not user input). */
    contentHtml?: string;
  }

  let { title, start, end, organization, organizationUrl, location, contentHtml }: Props = $props();
</script>

<article class="resume-entry">
  <div class="resume-entry__heading">
    <h3 class="resume-entry__title p-name">{title}</h3>

    <p class="resume-entry__dates">
      <time class="dt-start" datetime={toISODate(start)}>{formatMonthYear(start)}</time>
      {#if end === 'present'}
        <span>–</span>
        <span>Present</span>
      {:else if end}
        <span>–</span>
        <time class="dt-end" datetime={toISODate(end)}>{formatMonthYear(end)}</time>
      {/if}
    </p>
  </div>

  {#if organization}
    <p class="resume-entry__org h-card">
      {#if organizationUrl}
        <a href={organizationUrl} class="p-name u-url" target="_blank" rel="noopener noreferrer">{organization}</a>
      {:else}
        <span class="p-name">{organization}</span>
      {/if}
      {#if location}
        <span aria-hidden="true">·</span>
        <span class="p-location">{location}</span>
      {/if}
    </p>
  {/if}

  {#if contentHtml}
    <div class="resume-entry__summary p-summary">
      {@html contentHtml}
    </div>
  {/if}
</article>

<style>
  .resume-entry {
    padding-block-start: var(--space-3);
  }

  .resume-entry__heading {
    display: flex;
    flex-direction: column;
  }

  .resume-entry__title {
    font: var(--typography-title);
  }

  .resume-entry__dates {
    /* Dates lead visually while the heading stays first in reading/DOM order. */
    order: -1;
    margin-block-end: var(--space-1);
    font-size: 0.9375rem;
    color: var(--color-text-secondary);
  }

  .resume-entry__org {
    font-size: 1.25rem;
  }

  .resume-entry__org .p-name {
    color: var(--color-brand-primary);
  }
</style>
