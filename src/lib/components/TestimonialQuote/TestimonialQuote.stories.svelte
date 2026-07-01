<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import TestimonialQuote from './TestimonialQuote.svelte';

  const { Story } = defineMeta({
    title: 'Content/TestimonialQuote',
    component: TestimonialQuote,
    tags: ['autodocs'],
    args: {
      quote:
        "Andrew has an innate talent for leadership and mentorship. As a manager, Andrew never acts like a superior, he acts like an advocate.",
      authorName: 'Jax Heinzen',
      authorRole: 'Experience Research & Design, Binary Defense',
      authorUrl: 'https://www.linkedin.com/in/jacquelineheinzen/',
    },
  });
</script>

<Story name="Default" />

<Story name="Without a link" args={{ authorUrl: undefined }} />
