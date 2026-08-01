<script lang="ts">
  import type { Picture } from '@sveltejs/enhanced-img';

  interface Props {
    quote: string;
    authorName: string;
    authorRole: string;
    authorUrl?: string;
    /** An `?enhanced`-imported image module, not a plain path -- see the callers. */
    avatar?: Picture;
  }

  let { quote, authorName, authorRole, authorUrl, avatar }: Props = $props();
</script>

<figure class="testimonial">
  <blockquote class="quote">{quote}</blockquote>
  <figcaption class="caption">
    {#if avatar}
      <enhanced:img class="avatar" src={avatar} alt="" sizes="40px" />
    {/if}
    {#if authorUrl}
      <a href={authorUrl} target="_blank" rel="noopener noreferrer">{authorName}</a>
    {:else}
      <span>{authorName}</span>
    {/if}, {authorRole}
  </figcaption>
</figure>

<style>
  .testimonial {
    margin: 0;
  }

  .quote {
    /* Typographic differentiation only, per DESIGN.md; see src/app.css for the shared rule. */
    margin-block-end: var(--space-2);
  }

  .caption {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    font-size: 0.9375rem;
    color: var(--color-text-secondary);
  }

  .avatar {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-full);
  }
</style>
