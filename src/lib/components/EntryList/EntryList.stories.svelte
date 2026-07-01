<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { within } from 'storybook/test';
  import EntryList from './EntryList.svelte';
  import type { ResumeEntryData } from '$lib/types/resume';

  const entries: ResumeEntryData[] = [
    {
      title: 'User Experience Designer',
      organization: 'Society of Grownups',
      location: 'Boston, MA',
      start: '2016-01-01',
      end: '2018-06-01',
      contentHtml: '<p>Designed the employee onboarding experience.</p>',
    },
    {
      title: 'Senior User Experience Designer',
      organization: 'Expel',
      organizationUrl: 'https://expel.com',
      location: 'Pittsburgh, PA',
      start: '2022-01-01',
      end: 'present',
      contentHtml: '<p>Owns the Expel Design System end-to-end.</p>',
    },
  ];

  const { Story } = defineMeta({
    title: 'Content/EntryList',
    component: EntryList,
    tags: ['autodocs'],
    args: { entries },
  });
</script>

<Story
  name="Default"
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const items = canvas.getAllByRole('listitem');
    // Newest-first display order, even though entries are supplied oldest-first.
    await canvas.findByText('Senior User Experience Designer');
    if (items.length !== 2) throw new Error(`expected 2 entries, got ${items.length}`);
  }}
/>
