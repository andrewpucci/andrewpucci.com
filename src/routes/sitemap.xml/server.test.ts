import { describe, expect, it } from 'vite-plus/test';
import { cards } from '$lib/content/cards';
import { GET } from './+server';

describe('GET /sitemap.xml', () => {
  it('returns well-formed XML with the application/xml content type', async () => {
    const response = GET();
    expect(response.headers.get('Content-Type')).toBe('application/xml');
    const xml = await response.text();
    expect(xml).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>/);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
  });

  it('includes the static top-level pages and every portfolio card URL', async () => {
    const xml = await GET().text();
    for (const path of ['/', '/portfolio/', '/resume/']) {
      expect(xml).toContain(`<loc>https://andrewpucci.com${path}</loc>`);
    }
    for (const card of cards) {
      expect(xml).toContain(`<loc>https://andrewpucci.com${card.url}</loc>`);
    }
  });

  it('excludes the contact page and archive case studies', async () => {
    const xml = await GET().text();
    expect(xml).not.toContain('/contact/');
    expect(xml).not.toContain('/portfolio/archive/');
  });
});
