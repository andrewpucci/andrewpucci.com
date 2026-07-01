<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { expect, within } from 'storybook/test';
  import PortfolioCard from './PortfolioCard.svelte';

  const { Story } = defineMeta({
    title: 'Content/PortfolioCard',
    component: PortfolioCard,
    tags: ['autodocs'],
    args: {
      title: 'Evolving Binary Defense MDR',
      content:
        'Researching user workflows to design improvements to the UI of an information security SaaS application.',
      imgSrc: '/img/card-img/evolving-binary-defense-mdr.jpg',
      imgAlt: '',
      url: '/portfolio/evolving-binary-defense-mdr',
    },
  });
</script>

<Story
  name="Default"
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole('link');
    await expect(link).toHaveAttribute('href', '/portfolio/evolving-binary-defense-mdr');
  }}
/>
