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
  <div class="heading">
    <h3 class="title p-name">{title}</h3>

    <p class="dates">
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
    <p class="org h-card">
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
    <div class="summary p-summary">
      {@html contentHtml}
    </div>
  {/if}
</article>

<style>
  .resume-entry {
    padding-block-start: var(--space-3);
  }

  .heading {
    display: flex;
    flex-direction: column;
  }

  .title {
    font: var(--typography-title);
  }

  .dates {
    /* Dates lead visually while the heading stays first in reading/DOM order. */
    order: -1;
    margin-block-end: var(--space-1);
    font-size: 0.9375rem;
    color: var(--color-text-secondary);
  }

  .org {
    font-size: 1.25rem;
  }

  .org .p-name {
    color: var(--color-brand-primary);
  }
</style>
