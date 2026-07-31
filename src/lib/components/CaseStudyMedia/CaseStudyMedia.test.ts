import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  join(process.cwd(), 'src/lib/components/CaseStudyMedia/CaseStudyMedia.svelte'),
  'utf8'
);
const blockSource = readFileSync(
  join(process.cwd(), 'src/lib/components/CaseStudyMedia/CaseStudyMediaBlock.svelte'),
  'utf8'
);
const gallerySource = readFileSync(
  join(process.cwd(), 'src/lib/components/CaseStudyMedia/CaseStudyMediaGallery.svelte'),
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

describe('CaseStudyMediaBlock', () => {
  it('accepts snippet content for paired media-and-copy layouts', () => {
    expect(blockSource).toContain('media?: Snippet;');
    expect(blockSource).toContain('children?: Snippet;');
    expect(blockSource).toContain('{@render media()}');
    expect(blockSource).toContain('{@render children()}');
  });

  it('supports a reversed desktop layout', () => {
    expect(blockSource).toContain('reverse?: boolean;');
    expect(blockSource).toContain('case-study-media-block--reverse');
  });
});

describe('CaseStudyMediaGallery', () => {
  it('renders shared galleries through snippet children', () => {
    expect(gallerySource).toContain('children?: Snippet;');
    expect(gallerySource).toContain('{@render children()}');
  });

  it('supports both two-column and three-column gallery variants', () => {
    expect(gallerySource).toContain('columns?: 2 | 3;');
    expect(gallerySource).toContain('case-study-media-gallery--two');
    expect(gallerySource).toContain('case-study-media-gallery--three');
  });
});
