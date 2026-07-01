import type { Component } from 'svelte';
import type { CaseStudyMetadata } from '$lib/types/case-study';

export interface CaseStudyModule {
  Component: Component;
  metadata: CaseStudyMetadata;
}

const modules = import.meta.glob<{ default: Component; metadata: Omit<CaseStudyMetadata, 'slug'> }>(
  './portfolio/*.md',
  { eager: true }
);

const bySlug = new Map<string, CaseStudyModule>();

for (const [path, mod] of Object.entries(modules)) {
  const slug = path.replace('./portfolio/', '').replace(/\.md$/, '');
  bySlug.set(slug, { Component: mod.default, metadata: { ...mod.metadata, slug } });
}

export function getCaseStudy(slug: string): CaseStudyModule | undefined {
  return bySlug.get(slug);
}

export function getCaseStudySlugs(): string[] {
  return [...bySlug.keys()];
}
