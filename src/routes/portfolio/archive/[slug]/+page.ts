import { error } from '@sveltejs/kit';
import { getArchiveCaseStudy, getArchiveCaseStudySlugs } from '$lib/content/archive';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () =>
  getArchiveCaseStudySlugs().map((slug) => ({
    slug,
  }));

export const load: PageLoad = ({ params }) => {
  const entry = getArchiveCaseStudy(params.slug);
  if (!entry) error(404, 'Archived case study not found');

  return {
    metadata: entry.metadata,
  };
};
