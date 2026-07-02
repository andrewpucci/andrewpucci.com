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
    <li class="entry-list__item h-event">
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
  }

  .entry-list::before {
    position: absolute;
    inset-inline-start: 1.1rem;
    /* Matches .entry-list__item::before's own top offset + half its height, so
       the rule starts at the first dot's vertical center instead of overshooting
       above it into whatever heading precedes the list. */
    top: calc(0.375em + var(--timeline-dot-size) / 2);
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

  .entry-list__item {
    position: relative;
    padding-inline-start: var(--space-3);
  }

  .entry-list__item::before {
    position: absolute;
    top: 0.375em;
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
