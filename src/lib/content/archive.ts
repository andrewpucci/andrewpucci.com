import type { Component } from 'svelte';
import type { CaseStudyMetadata } from '$lib/types/case-study';

export interface ArchiveCaseStudy {
  Component: Component;
  metadata: CaseStudyMetadata;
}

export interface ArchiveCaseStudyModule {
  default: Component;
  metadata: Omit<CaseStudyMetadata, 'slug'>;
}

const modules = import.meta.glob<ArchiveCaseStudyModule>('./archive/*.svx', {
  eager: true,
});

export function buildArchiveEntries(
  archiveModules: Record<string, ArchiveCaseStudyModule>
): Map<string, ArchiveCaseStudy> {
  const entries = new Map<string, ArchiveCaseStudy>();

  for (const [path, mod] of Object.entries(archiveModules)) {
    const slug = path.replace('./archive/', '').replace(/\.svx$/, '');
    entries.set(slug, {
      Component: mod.default,
      metadata: { ...mod.metadata, slug },
    });
  }

  return entries;
}

const archiveEntries = buildArchiveEntries(modules);

export function getArchiveCaseStudy(slug: string): ArchiveCaseStudy | undefined {
  return archiveEntries.get(slug);
}

export function getArchiveCaseStudySlugs(): string[] {
  return [...archiveEntries.keys()].sort();
}
