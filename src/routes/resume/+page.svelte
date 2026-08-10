<script lang="ts">
  import EntryList from '$lib/components/EntryList/EntryList.svelte';
  import { author } from '$lib/content/author';
  import { educationEntries, speakingEntries, volunteeringEntries, workEntries } from '$lib/content/resume';
</script>

<svelte:head>
  <title>Résumé | Andrew Pucci</title>
  <meta
    name="description"
    content="Andrew Pucci's professional experience, education, speaking engagements, and volunteer work."
  />
</svelte:head>

<div class="resume">
  <header class="header vcard h-card">
    <div class="name-row">
      <h1 class="p-name">{author.name}</h1>
      <em class="p-gender-identity">({author.pronouns})</em>
    </div>
    <p class="lead">
      <span class="p-job-title">{author.occupation}</span>
      <span aria-hidden="true">·</span>
      <span class="p-locality">{author.location}</span>
    </p>
  </header>

  <section aria-labelledby="experience-heading">
    <h2 id="experience-heading">Professional Experience</h2>
    <EntryList entries={workEntries} />
  </section>

  <section aria-labelledby="education-heading">
    <h2 id="education-heading">Education</h2>
    <EntryList entries={educationEntries} />
  </section>

  <section aria-labelledby="speaking-heading">
    <h2 id="speaking-heading">Speaking Engagements</h2>
    <EntryList entries={speakingEntries} />
  </section>

  <section aria-labelledby="volunteering-heading">
    <h2 id="volunteering-heading">Volunteer Experience</h2>
    <EntryList entries={volunteeringEntries} />
  </section>

  <section aria-labelledby="skills-heading">
    <h2 id="skills-heading">Skills</h2>
    <ul class="pill-list">
      {#each author.skills as skill (skill)}
        <li>{skill}</li>
      {/each}
    </ul>
  </section>

  <section aria-labelledby="tools-heading">
    <h2 id="tools-heading">Tools</h2>
    <ul class="pill-list">
      {#each author.tools as tool (tool)}
        <li>{tool}</li>
      {/each}
    </ul>
  </section>
</div>

<style>
  .resume {
    max-width: 48rem;
    margin-inline: auto;
    padding: var(--space-3);
  }

  .header {
    margin-block-end: var(--space-4);
  }

  .name-row {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  .lead {
    font: var(--typography-title);
    color: var(--color-text-secondary);
  }

  section {
    margin-block-end: var(--space-4);
  }

  .pill-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .pill-list li {
    font: var(--typography-label);
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    padding-block: var(--space-1);
    padding-inline: var(--space-2);
  }
</style>
