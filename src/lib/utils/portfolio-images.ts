import type { Picture } from '@sveltejs/enhanced-img';

// Portfolio card/hero images are referenced as plain string paths from data
// (cards.json's imgSrc, case study frontmatter's hero) so that content stays
// decoupled from the build pipeline. This resolves those paths to the
// @sveltejs/enhanced-img module the glob below picked up at build time.
const modules = import.meta.glob('/src/lib/assets/img/card/*.{jpg,jpeg,png}', {
  eager: true,
  query: { enhanced: true },
}) as Record<string, { default: Picture }>;

export function portfolioImage(path: string): Picture {
  const filename = path.split('/').pop();
  const entry = Object.entries(modules).find(([key]) => key.endsWith(`/${filename}`));
  if (!entry) {
    throw new Error(`No portfolio image found for "${path}". Checked src/lib/assets/img/card/.`);
  }
  return entry[1].default;
}
