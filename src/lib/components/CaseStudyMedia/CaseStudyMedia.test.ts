import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  join(process.cwd(), 'src/lib/components/CaseStudyMedia/CaseStudyMedia.svelte'),
  'utf8'
);

describe('CaseStudyMedia', () => {
  it('renders case study media inside a shared figure wrapper', () => {
    expect(source).toContain('<figure class="case-study-media">');
    expect(source).toContain('<img {src} {alt} />');
  });

  it('supports expandable media without requiring every page to import ExpandableImage directly', () => {
    expect(source).toContain(
      "import ExpandableImage from '$lib/components/ExpandableImage/ExpandableImage.svelte';"
    );
    expect(source).toContain('{#if expandable}');
    expect(source).toContain('<ExpandableImage {src} {alt} />');
  });

  it('supports optional captions for shared portfolio figures', () => {
    expect(source).toContain('{#if caption}');
    expect(source).toContain('<figcaption>{caption}</figcaption>');
  });
});
