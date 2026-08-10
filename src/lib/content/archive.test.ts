import { describe, expect, it } from 'vite-plus/test';
import {
  buildArchiveEntries,
  getArchiveCaseStudy,
  getArchiveCaseStudySlugs,
  type ArchiveCaseStudyModule,
} from './archive';
import type { Component } from 'svelte';

describe('getArchiveCaseStudySlugs', () => {
  it('lists all eight archived case study slugs', () => {
    expect(getArchiveCaseStudySlugs()).toEqual([
      'bookmooch-social-networking-survey',
      'carnation-city-mall-blueprints',
      'employee-tool',
      'local-yokel-foods-paper-prototype',
      'revamping-course-registration',
      'society-of-grownups-website',
      'understanding-justcode-users',
      'young-professionals-of-akron-usability-study',
    ]);
  });
});

describe('getArchiveCaseStudy', () => {
  it('returns frontmatter metadata and an mdsvex component for a known archive entry', () => {
    const entry = getArchiveCaseStudy('employee-tool');

    expect(entry).toBeDefined();
    expect(entry?.metadata.slug).toBe('employee-tool');
    expect(entry?.metadata.hero).toBe('/img/archive/card/employee-tool.png');
    expect(entry?.Component).toBeTypeOf('function');
  });

  it('returns undefined for an unknown archive slug', () => {
    expect(getArchiveCaseStudy('does-not-exist')).toBeUndefined();
  });
});

describe('buildArchiveEntries', () => {
  const archiveModules: Record<string, ArchiveCaseStudyModule> = {
    './archive/example.svx': {
      default: (() => {}) as unknown as Component,
      metadata: {
        title: 'Example',
        description: 'Example description',
        hero: '/img/archive/card/example.png',
        heroTitle: 'Example',
        team: [],
        responsibilities: [],
        tools: [],
      },
    },
  };

  it('derives the slug from the mdsvex module path', () => {
    const entry = buildArchiveEntries(archiveModules).get('example');

    expect(entry?.metadata.slug).toBe('example');
    expect(entry?.metadata.title).toBe('Example');
    expect(entry?.Component).toBe(archiveModules['./archive/example.svx'].default);
  });
});
