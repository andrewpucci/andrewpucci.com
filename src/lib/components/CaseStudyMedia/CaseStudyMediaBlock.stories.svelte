<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { expect, within } from 'storybook/test';
  import CaseStudyMedia from './CaseStudyMedia.svelte';
  import CaseStudyMediaBlock from './CaseStudyMediaBlock.svelte';

  const { Story } = defineMeta({
    title: 'Content/CaseStudyMediaBlock',
    component: CaseStudyMediaBlock,
    tags: ['autodocs'],
  });
</script>

<Story name="Default">
  {#snippet template()}
    <CaseStudyMediaBlock>
      {#snippet media()}
        <CaseStudyMedia
          src="/img/portfolio/sog-eo-1.png"
          alt="Screenshot of a document outlining the new employee onboarding process"
        />
      {/snippet}
      <p>Paired media and copy. The media pane comes first in the DOM and reads first on screen.</p>
    </CaseStudyMediaBlock>
  {/snippet}
</Story>

<Story
  name="Reversed keeps DOM order matching reading order"
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = canvas.getByText(/copy pane reads first/i);
    const image = canvas.getByRole('img', {
      name: 'Screenshot of a document outlining the new employee onboarding process',
    });
    // ADR-0002: focus order follows the visual reading order. A reversed block
    // puts the copy on the left, so the copy must also come first in the DOM.
    await expect(body.compareDocumentPosition(image) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  }}
>
  {#snippet template()}
    <CaseStudyMediaBlock reverse>
      {#snippet media()}
        <CaseStudyMedia
          src="/img/portfolio/sog-eo-1.png"
          alt="Screenshot of a document outlining the new employee onboarding process"
        />
      {/snippet}
      <p>Reversed layout: the copy pane reads first, with the media to its right.</p>
    </CaseStudyMediaBlock>
  {/snippet}
</Story>
