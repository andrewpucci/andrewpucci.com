import { describe, expect, it } from 'vitest';
import { getArchiveCaseStudy, getArchiveCaseStudySlugs } from './archive';

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
  it('returns metadata and rendered html for a known archive entry', () => {
    const entry = getArchiveCaseStudy('employee-tool');

    expect(entry).toBeDefined();
    expect(entry?.metadata.slug).toBe('employee-tool');
    expect(entry?.metadata.hero).toBe('/img/archive/card/employee-tool.png');
    expect(entry?.html).toContain('/img/archive/employee-tool-1.png');
    expect(entry?.html).not.toContain('{% image');
  });

  it('replaces blocked iframe embeds with plain links', () => {
    const entry = getArchiveCaseStudy('carnation-city-mall-blueprints');

    expect(entry?.html).toContain('View Carnation City Mall website redesign presentation');
    expect(entry?.html).not.toContain('<iframe');
  });

  it('replaces legacy icon fonts with visible text symbols', () => {
    const entry = getArchiveCaseStudy('young-professionals-of-akron-usability-study');

    expect(entry?.html).toContain('✓ = Successful');
    expect(entry?.html).toContain('↓');
    expect(entry?.html).not.toContain('fa-check-circle');
  });

  it('rewrites the empty legacy table corner cell as a data cell, not a header', () => {
    const entry = getArchiveCaseStudy('young-professionals-of-akron-usability-study');

    expect(entry?.html).not.toContain('<th>&nbsp;</th>');
    expect(entry?.html).toContain('<td></td>');
  });

  it('returns undefined for an unknown archive slug', () => {
    expect(getArchiveCaseStudy('does-not-exist')).toBeUndefined();
  });
});
