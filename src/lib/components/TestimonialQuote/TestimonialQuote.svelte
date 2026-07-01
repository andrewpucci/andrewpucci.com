<script lang="ts">
  interface Props {
    quote: string;
    authorName: string;
    authorRole: string;
    authorUrl?: string;
    avatarSrc?: string;
  }

  let { quote, authorName, authorRole, authorUrl, avatarSrc }: Props = $props();
</script>

<figure class="testimonial">
  <blockquote class="testimonial__quote">{quote}</blockquote>
  <figcaption class="testimonial__caption">
    {#if avatarSrc}
      <img class="testimonial__avatar" src={avatarSrc} alt="" width="40" height="40" />
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

  .testimonial__quote {
    /* Typographic differentiation only, per DESIGN.md; see src/app.css for the shared rule. */
    margin-block-end: var(--space-2);
  }

  .testimonial__caption {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    font-size: 0.9375rem;
    color: var(--color-text-secondary);
  }

  .testimonial__avatar {
    border-radius: var(--radius-full);
  }
</style>
