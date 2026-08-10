<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { expect, within } from 'storybook/test';
  import CaseStudyMedia from './CaseStudyMedia.svelte';
  import CaseStudyMediaGallery from './CaseStudyMediaGallery.svelte';

  const { Story } = defineMeta({
    title: 'Content/CaseStudyMediaGallery',
    component: CaseStudyMediaGallery,
    tags: ['autodocs'],
  });
</script>

<Story
  name="Three column"
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('img')).toHaveLength(3);
  }}
>
  {#snippet template()}
    <CaseStudyMediaGallery>
      <CaseStudyMedia src="/img/portfolio/support-dashboard.png" alt="Mockup of documentation homepage" />
      <CaseStudyMedia src="/img/portfolio/support-kb.png" alt="Mockup of the knowledgebase interface" />
      <CaseStudyMedia src="/img/portfolio/support-videos.png" alt="Mockup of video search in documentation" />
    </CaseStudyMediaGallery>
  {/snippet}
</Story>

<Story name="Two column, wide">
  {#snippet template()}
    <CaseStudyMediaGallery columns={2} wide>
      <CaseStudyMedia src="/img/portfolio/t-rta-2.png" alt="Screenshot of the TeamPulse interface" expandable />
      <CaseStudyMedia src="/img/portfolio/t-rta-3.png" alt="Mockup of redesigned installations dashboard" expandable />
    </CaseStudyMediaGallery>
  {/snippet}
</Story>
