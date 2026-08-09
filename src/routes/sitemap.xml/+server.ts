import { cards } from '$lib/content/cards';
import { author } from '$lib/content/author';

// Redundant with the root +layout.ts's prerender = true, kept for
// self-documentation: this route's content is entirely build-time-known.
export const prerender = true;

export function GET() {
  const paths = ['/', '/portfolio/', '/resume/', ...cards.map((card) => card.url)];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((path) => `  <url><loc>${author.website}${path}</loc></url>`).join('\n')}
</urlset>
`;

  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
}
