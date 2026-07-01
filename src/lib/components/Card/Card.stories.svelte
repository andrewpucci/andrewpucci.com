<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { expect, within } from 'storybook/test';
  import Card from './Card.svelte';

  const { Story } = defineMeta({
    title: 'Primitives/Card',
    component: Card,
    tags: ['autodocs'],
  });
</script>

<Story name="Default">
  {#snippet template()}
    <Card>
      <h3>Evolving Binary Defense MDR</h3>
      <p>Researching user workflows to design improvements to the UI of an information security SaaS application.</p>
    </Card>
  {/snippet}
</Story>

<Story
  name="As a link"
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole('link', { name: /evolving binary defense/i });
    await expect(link).toHaveAttribute('href', '/portfolio/evolving-binary-defense-mdr');
  }}
>
  {#snippet template()}
    <Card href="/portfolio/evolving-binary-defense-mdr">
      <h3>Evolving Binary Defense MDR</h3>
      <p>Researching user workflows to design improvements to the UI of an information security SaaS application.</p>
    </Card>
  {/snippet}
</Story>
