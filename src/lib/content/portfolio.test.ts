import { describe, expect, it } from 'vitest';
import { getCaseStudy, getCaseStudySlugs } from './portfolio';

describe('getCaseStudySlugs', () => {
  it('lists every case study markdown file as a slug', () => {
    const slugs = getCaseStudySlugs();
    expect(slugs).toContain('redesigning-telerik-analytics');
    expect(slugs.length).toBeGreaterThanOrEqual(6);
  });
});

describe('getCaseStudy', () => {
  it('returns the component and metadata for a known slug', () => {
    const entry = getCaseStudy('redesigning-telerik-analytics');
    expect(entry).toBeDefined();
    expect(entry?.metadata.slug).toBe('redesigning-telerik-analytics');
    expect(entry?.metadata.title).toContain('Redesigning Telerik Analytics');
    expect(entry?.Component).toBeTypeOf('function');
  });

  it('returns undefined for an unknown slug', () => {
    expect(getCaseStudy('does-not-exist')).toBeUndefined();
  });
});
