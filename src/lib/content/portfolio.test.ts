import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vite-plus/test';
import { getCaseStudy, getCaseStudySlugs } from './portfolio';

const portfolioDir = join(process.cwd(), 'src/lib/content/portfolio');
const caseStudyFiles = readdirSync(portfolioDir)
  .filter((file) => file.endsWith('.md'))
  .sort();

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

  it('keeps the six live case studies on shared body patterns', () => {
    expect(caseStudyFiles).toHaveLength(6);

    for (const slug of getCaseStudySlugs()) {
      const source = readFileSync(join(portfolioDir, `${slug}.md`), 'utf8');

      expect(source).toContain('## Challenge');
      expect(source).toContain('CaseStudyMedia');
      expect(source).toMatch(/CaseStudyMedia(Block|Gallery)/);
      expect(source).not.toContain('ExpandableImage');
      expect(source).not.toContain('<img ');
      expect(source).not.toContain('media-block');
      expect(source).not.toContain('thumbnail-grid');
      expect(source).not.toContain('case-study-layout');
    }
  });
});
