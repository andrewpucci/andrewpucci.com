<script lang="ts">
  import ResumeEntry from '$lib/components/ResumeEntry/ResumeEntry.svelte';
  import type { ResumeEntryData } from '$lib/types/resume';

  interface Props {
    /** Oldest-first, matching how the resume collections are sorted at load time. */
    entries: ResumeEntryData[];
  }

  let { entries }: Props = $props();

  const displayOrder = $derived([...entries].reverse());
</script>

<ol class="entry-list" reversed>
  {#each displayOrder as entry (entry.title + entry.start)}
    <li class="item h-event">
      <ResumeEntry {...entry} />
    </li>
  {/each}
</ol>

<style>
  .entry-list {
    position: relative;
    margin: 0;
    padding-inline-start: var(--space-3);
    list-style: none;
    /* Vertical center of the title row within a ResumeEntry, measured from the
       top of the <li>: the entry's own padding-block-start, plus the dates
       row's height and margin (rendered first via ResumeEntry's `order: -1`),
       plus half the title's own line height. Matches production, where the
       dot sits beside the job title, not the date line above it. Depends on
       ResumeEntry.svelte's structure -- update both if either changes. */
    --timeline-marker-center: calc(
      var(--space-3) + (0.9375rem * 1.5) + var(--space-1) +
        (var(--typography-title-font-size) * var(--typography-title-line-height) / 2)
    );
  }

  .entry-list::before {
    position: absolute;
    inset-inline-start: 1.1rem;
    /* Matches .item::before's own target center below, so the rule
       starts at the first dot rather than overshooting above it. */
    top: var(--timeline-marker-center);
    bottom: 0;
    display: block;
    width: 1px;
    content: '';
    background: linear-gradient(
      to top,
      color-mix(in srgb, var(--timeline-rule-color) 0%, transparent) 0%,
      var(--timeline-rule-color) 6.25rem,
      var(--timeline-rule-color) 100%
    );
  }

  .item {
    position: relative;
    padding-inline-start: var(--space-3);
  }

  .item::before {
    position: absolute;
    top: calc(var(--timeline-marker-center) - var(--timeline-dot-size) / 2);
    inset-inline-start: 0;
    display: block;
    width: var(--timeline-dot-size);
    height: var(--timeline-dot-size);
    content: '';
    background-color: var(--timeline-dot-color);
    border-radius: var(--radius-full);
    transform: translateX(-50%);
  }
</style>
