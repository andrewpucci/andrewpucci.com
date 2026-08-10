<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { expect, within } from 'storybook/test';
  import Input from './Input.svelte';

  const { Story } = defineMeta({
    title: 'Primitives/Input',
    component: Input,
    tags: ['autodocs'],
    args: {
      label: 'Name',
      name: 'name',
    },
  });
</script>

<Story name="Default" />

<Story
  name="Required with hint"
  args={{
    label: 'Email',
    name: 'email',
    type: 'email',
    required: true,
    hint: 'Use a format like name@example.com.',
  }}
/>

<Story
  name="With an error"
  args={{ error: 'Enter your name.', required: true }}
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: /^Name\b/ });
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAccessibleDescription('Error: Enter your name.');
  }}
/>
