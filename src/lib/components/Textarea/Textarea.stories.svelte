<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { expect, within } from 'storybook/test';
  import Textarea from './Textarea.svelte';

  const { Story } = defineMeta({
    title: 'Primitives/Textarea',
    component: Textarea,
    tags: ['autodocs'],
    args: {
      label: 'Message',
      name: 'message',
    },
  });
</script>

<Story name="Default" />

<Story
  name="With an error"
  args={{ error: 'Enter a message.' }}
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText('Message');
    await expect(textarea).toHaveAttribute('aria-invalid', 'true');
    await expect(textarea).toHaveAccessibleDescription('Enter a message.');
  }}
/>
