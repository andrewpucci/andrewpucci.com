<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { expect, userEvent, within } from 'storybook/test';
  import ExpandableImage from './ExpandableImage.svelte';

  const { Story } = defineMeta({
    title: 'Primitives/ExpandableImage',
    component: ExpandableImage,
    tags: ['autodocs'],
    args: {
      src: '/img/portfolio/t-rta-1.png',
      alt: 'Screenshot of the Silverlight EQATEC interface',
    },
  });
</script>

<Story name="Default" />

<Story
  name="Opens and closes via keyboard"
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', {
      name: 'Screenshot of the Silverlight EQATEC interface',
    });
    await userEvent.click(trigger);
    const dialog = canvas.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const closeButton = canvas.getByRole('button', { name: 'Close' });
    await userEvent.click(closeButton);
    await expect(dialog).not.toBeVisible();
  }}
/>
