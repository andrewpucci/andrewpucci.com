import { error } from '@sveltejs/kit';
import { getCaseStudy } from '$lib/content/portfolio';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
  const entry = getCaseStudy(params.slug);
  if (!entry) error(404, 'Case study not found');

  return {
    metadata: entry.metadata,
    downloadFile: entry.metadata.downloadFile,
  };
};
