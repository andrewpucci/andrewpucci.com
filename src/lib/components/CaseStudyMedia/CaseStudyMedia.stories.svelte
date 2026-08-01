<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { expect, within } from 'storybook/test';
  import CaseStudyMedia from './CaseStudyMedia.svelte';

  const { Story } = defineMeta({
    title: 'Content/CaseStudyMedia',
    component: CaseStudyMedia,
    tags: ['autodocs'],
    args: {
      src: '/img/portfolio/t-rta-1.png',
      alt: 'Screenshot of the Silverlight EQATEC interface',
    },
  });
</script>

<Story
  name="Default"
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('img', { name: 'Screenshot of the Silverlight EQATEC interface' })).toBeVisible();
    await expect(canvas.queryByRole('button')).toBeNull();
  }}
/>

<Story name="With a caption" args={{ caption: 'The original EQATEC dashboard, before the redesign.' }} />

<Story
  name="Expandable"
  args={{ expandable: true }}
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('button', { name: 'Screenshot of the Silverlight EQATEC interface' })
    ).toBeVisible();
  }}
/>
