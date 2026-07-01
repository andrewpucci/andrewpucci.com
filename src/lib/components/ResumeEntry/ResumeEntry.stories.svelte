<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import ResumeEntry from './ResumeEntry.svelte';

  const { Story } = defineMeta({
    title: 'Content/ResumeEntry',
    component: ResumeEntry,
    tags: ['autodocs'],
    args: {
      title: 'Senior User Experience Designer',
      organization: 'Expel',
      organizationUrl: 'https://expel.com',
      location: 'Pittsburgh, PA',
      start: '2022-01-01',
      end: 'present',
      contentHtml: '<p>Owns the Expel Design System end-to-end, from Figma tokens to TypeScript implementation.</p>',
    },
  });
</script>

<Story name="Current role" />

<Story
  name="Past role"
  args={{
    organization: 'Society of Grownups',
    organizationUrl: undefined,
    start: '2016-01-01',
    end: '2018-06-01',
  }}
/>
