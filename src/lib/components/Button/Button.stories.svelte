<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { expect, fn, userEvent, within } from 'storybook/test';
  import Button from './Button.svelte';

  const { Story } = defineMeta({
    title: 'Primitives/Button',
    component: Button,
    tags: ['autodocs'],
    args: {
      onclick: fn(),
    },
  });
</script>

<Story name="Primary" args={{ variant: 'primary' }}>
  {#snippet template(args)}
    <Button {...args}>Get in touch</Button>
  {/snippet}
</Story>

<Story
  name="Disabled"
  args={{ variant: 'primary', disabled: true }}
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Get in touch' });
    await expect(button).toBeDisabled();
  }}
>
  {#snippet template(args)}
    <Button {...args}>Get in touch</Button>
  {/snippet}
</Story>

<Story
  name="Keyboard activation"
  args={{ variant: 'primary' }}
  play={async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Get in touch' });
    button.focus();
    await expect(button).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onclick).toHaveBeenCalled();
  }}
>
  {#snippet template(args)}
    <Button {...args}>Get in touch</Button>
  {/snippet}
</Story>

<Story
  name="As a link"
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole('link', { name: 'Download résumé' });
    await expect(link).toHaveAttribute('href', '/files/andrew-pucci-resume.pdf');
  }}
>
  {#snippet template()}
    <Button href="/files/andrew-pucci-resume.pdf">Download résumé</Button>
  {/snippet}
</Story>
